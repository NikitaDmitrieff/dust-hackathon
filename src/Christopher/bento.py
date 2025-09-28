#!/usr/bin/env python3
"""
One-shot: fetch grouped survey data via retrieve_supabase2.py and render Bento tiles
that match your site's theme.

Usage:
  # Full page (good for iframe)
  python bento.py --form-id <UUID> --out ./dashboard.html

  # Fragment (just the tiles + per-tile init scripts; good for in-page embedding)
  python bento.py --form-id <UUID> --fragment --out ./dashboard_fragment.html

Notes:
- Assumes Tailwind/shadcn theme classes exist (from-card, border-border, etc.).
- Fragment mode does NOT include <html> or global CSS; it injects a tiny loader that
  loads Plotly from CDN if not present.
- Full page mode includes Plotly CDN and minimal dark styles; still uses your tile classes.
"""

from __future__ import annotations
import html
import json
import os
import re
import statistics
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ---- import your existing fetcher/transformer ----
import retrieve_supabase2 as r2

# Optional OpenAI client (fallbacks if missing)
try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore


# =========================
# Types + detection
# =========================

@dataclass
class QuestionRecord:
    label: str
    answers: List[Any]
    answer_type: str  # number | boolean | categorical | multi | text

def detect_type(answers: List[Any]) -> str:
    if not answers:
        return "text"
    if any(isinstance(a, (list, tuple)) for a in answers):
        return "multi"
    nonempty = [a for a in answers if a is not None and a != ""]
    # numeric heuristic
    numeric_hits = 0
    for a in nonempty:
        if isinstance(a, (int, float)):
            numeric_hits += 1
        elif isinstance(a, str):
            try:
                float(a.strip())
                numeric_hits += 1
            except Exception:
                pass
    if nonempty and numeric_hits >= max(3, int(0.6 * len(nonempty))):
        return "number"
    lowers = [str(a).strip().lower() for a in nonempty]
    bool_map = {"true", "false", "yes", "no", "1", "0", "y", "n"}
    if lowers and all(v in bool_map for v in lowers):
        return "boolean"
    uniq = len(set(lowers))
    if 1 < uniq <= max(12, int(0.2 * len(nonempty))):
        return "categorical"
    return "text"


# =========================
# LLM planning
# =========================

@dataclass
class ChartSpec:
    chart_type: str  # histogram | box | violin | bar | bar_topk | text_ngrams
    title: str
    description: str
    size: str  # 1x1 | 2x1 | 2x2
    params: Dict[str, Any]


@dataclass
class DashboardRender:
    html: str
    title: str
    description: str
    question_count: int

ALLOWED_TYPES = {"histogram", "box", "violin", "bar", "bar_topk", "text_ngrams"}
ALLOWED_SIZES = {"1x1", "2x1", "2x2"}

def init_llm() -> Optional[OpenAI]:
    if OpenAI is None:
        return None
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("openai_api_key")
    if not api_key:
        return None
    try:
        return OpenAI(api_key=api_key)
    except Exception:
        return None

def plan_prompt(label: str, answer_type: str, answers: List[Any]) -> str:
    return (
        "You are a data viz assistant. Choose ONE effective chart for this question.\n"
        "Return ONLY a JSON object with keys: chart_type, title, description, size, params.\n"
        f"Allowed chart_type: {sorted(list(ALLOWED_TYPES))}.\n"
        "Guidelines:\n"
        "- number: histogram (auto bins) or box/violin.\n"
        "- boolean/categorical: bar or bar_topk (set top_k; rest is 'Other').\n"
        "- multi (list answers): flatten, bar_topk.\n"
        "- text: text_ngrams (ngram=1 or 2), top_k 15–30.\n"
        "- size: 1x1, 2x1, or 2x2; concise description.\n\n"
        f"Question: {label}\n"
        f"Type: {answer_type}\n"
        f"Sample answers: {json.dumps(answers[:30], ensure_ascii=False)}\n"
    )

def ask_llm(client: Optional[OpenAI], label: str, answer_type: str, answers: List[Any]) -> Optional[ChartSpec]:
    if client is None:
        return None
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.1,
            messages=[
                {"role": "system", "content": "You output only valid JSON — no prose."},
                {"role": "user", "content": plan_prompt(label, answer_type, answers)},
            ],
        )
        text = resp.choices[0].message.content.strip()
        data = json.loads(text)
        return validate_spec(label, answer_type, data)
    except Exception:
        return None

def validate_spec(label: str, answer_type: str, data: Dict[str, Any]) -> ChartSpec:
    ct = str(data.get("chart_type", "")).lower()
    if ct not in ALLOWED_TYPES:
        if answer_type == "number":
            ct = "histogram"
        elif answer_type in {"categorical", "boolean", "multi"}:
            ct = "bar_topk"
        else:
            ct = "text_ngrams"
    title = (data.get("title") or label).strip()
    desc = (data.get("description") or "").strip()
    size = str(data.get("size", "2x1"))
    if size not in ALLOWED_SIZES:
        size = "2x1"
    params = data.get("params") or {}
    # clamp params
    if ct == "histogram":
        bins = int(params.get("bins", 20))
        params = {"bins": max(5, min(100, bins))}
    elif ct in {"bar", "bar_topk", "text_ngrams"}:
        top_k = int(params.get("top_k", 20))
        top_k = max(5, min(50, top_k))
        ngram = int(params.get("ngram", 1))
        params = {"top_k": top_k, "ngram": (ngram if ct == "text_ngrams" and ngram in (1, 2) else 1)}
    else:
        params = {}
    return ChartSpec(ct, title, desc, size, params)

def fallback_spec(label: str, answer_type: str) -> ChartSpec:
    if answer_type == "number":
        return ChartSpec("histogram", label, "Distribution of numeric answers.", "2x1", {"bins": 20})
    if answer_type in {"categorical", "boolean"}:
        return ChartSpec("bar_topk", label, "Most frequent categories.", "2x1", {"top_k": 20, "ngram": 1})
    if answer_type == "multi":
        return ChartSpec("bar_topk", label, "Most selected options.", "2x1", {"top_k": 20, "ngram": 1})
    return ChartSpec("text_ngrams", label, "Most frequent terms in responses.", "2x1", {"top_k": 20, "ngram": 1})


# =========================
# Data utils
# =========================

WORD_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ0-9']+")

def tokenize(text: str, n: int = 1) -> List[str]:
    tokens = [t.lower() for t in WORD_RE.findall(text)]
    if n == 1:
        return tokens
    return [" ".join(tokens[i:i+n]) for i in range(len(tokens)-n+1)]

def flatten_multi(answers: List[Any]) -> List[str]:
    out: List[str] = []
    for a in answers:
        if isinstance(a, (list, tuple)):
            out.extend([str(x) for x in a if x not in (None, "")])
        elif a not in (None, ""):
            out.append(str(a))
    return out

def categorical_counts(answers: List[Any], top_k: int = 20) -> Tuple[List[str], List[int]]:
    vals = [str(a).strip() for a in answers if a is not None and str(a).strip() != ""]
    counts = Counter(vals)
    if len(counts) <= top_k:
        items = counts.most_common()
        return [k for k, _ in items], [v for _, v in items]
    items = counts.most_common(top_k - 1)
    other = sum(v for _, v in counts.items()) - sum(v for _, v in items)
    return [k for k, _ in items] + ["Other"], [v for _, v in items] + [other]

def ngram_counts(answers: List[Any], n: int = 1, top_k: int = 20) -> Tuple[List[str], List[int]]:
    c = Counter()
    for a in answers:
        s = a if isinstance(a, str) else str(a)
        for tok in tokenize(s, n=n):
            c[tok] += 1
    items = c.most_common(top_k)
    return [k for k, _ in items], [v for _, v in items]

def numeric_stats(values: List[float]) -> Dict[str, Optional[float]]:
    if not values:
        return {"count": 0, "mean": None, "median": None, "stdev": None, "min": None, "max": None}
    return {
        "count": len(values),
        "mean": statistics.fmean(values),
        "median": statistics.median(values),
        "stdev": statistics.pstdev(values) if len(values) > 1 else 0.0,
        "min": min(values),
        "max": max(values),
    }


# =========================
# Rendering helpers (Theme)
# =========================

# Your Bento tile outer classes (from your snippet)
TILE_CLASS = (
    "group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/80 "
    "border border-border/50 shadow-lg hover:shadow-xl hover:-translate-y-1 "
    "transition-all duration-200 ease-out p-6 md:col-span-1 md:row-span-1"
)

HEADER_ROW_CLASS = "flex items-center gap-2 mb-4"
TITLE_CLASS = "font-semibold"
DESC_CLASS = "text-sm text-muted-foreground mb-4"
BODY_CLASS = "flex-1 flex flex-col justify-center"
BTN_CLASS = (
    "justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background "
    "transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring "
    "focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 "
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background "
    "hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full flex items-center gap-2"
)

def tile_class(size: str) -> str:
    # You can map sizes to grid spans if needed; keeping 1x1 for now, your layout controls grid spans.
    return TILE_CLASS

def insight_text(label: str, answers: List[Any], atype: str) -> str:
    if atype == "number":
        nums = []
        for a in answers:
            try: nums.append(float(a))
            except: pass
        s = numeric_stats(nums)
        if s["count"] == 0:
            return "No data"
        return f"n={s['count']} • mean={s['mean']:.2f} • median={s['median']:.2f} • min={s['min']} • max={s['max']}"
    if atype in {"categorical", "boolean", "multi"}:
        vals = flatten_multi(answers) if atype == "multi" else [str(a) for a in answers if a not in (None, "")]
        if not vals:
            return "No data"
        top, cnt = Counter(vals).most_common(1)[0]
        return f"Top: “{top}” ({cnt}) • Unique={len(set(vals))} • Total={len(vals)}"
    words, counts = ngram_counts(answers, n=1, top_k=1)
    return f"Top term: “{words[0]}” ({counts[0]})" if words else "No data"

def render_trace_js(idx: int, label: str, answers: List[Any], atype: str, spec: ChartSpec) -> str:
    el = f"chart-{idx}"
    ct = spec.chart_type

    if atype == "number":
        nums = []
        for a in answers:
            try:
                nums.append(float(a))
            except Exception:
                pass
        nums_json = json.dumps(nums)
        if ct == "box":
            return f"Plotly.newPlot('{el}', [{{y:{nums_json}, type:'box'}}], {{margin:{{t:10,r:10,b:40,l:40}}}});"
        if ct == "violin":
            return f"Plotly.newPlot('{el}', [{{y:{nums_json}, type:'violin', points:'all'}}], {{margin:{{t:10,r:10,b:40,l:40}}}});"
        bins = int(spec.params.get("bins", 20))
        return (
            f"Plotly.newPlot('{el}', [{{x:{nums_json}, type:'histogram', nbinsx:{bins}}}], "
            f"{{xaxis:{{title:'Value'}}, yaxis:{{title:'Count'}}, margin:{{t:10,r:10,b:40,l:40}}}});"
        )

    if atype in {"categorical", "boolean"}:
        labels, values = categorical_counts(answers, top_k=int(spec.params.get("top_k", 20)))
        return (
            f"Plotly.newPlot('{el}', [{{x:{json.dumps(labels)}, y:{json.dumps(values)}, type:'bar'}}], "
            f"{{xaxis:{{automargin:true}}, yaxis:{{title:'Count'}}, margin:{{t:10,r:10,b:60,l:40}}}});"
        )

    if atype == "multi":
        flat = flatten_multi(answers)
        labels_, values_ = categorical_counts(flat, top_k=int(spec.params.get("top_k", 20)))
        return (
            f"Plotly.newPlot('{el}', [{{x:{json.dumps(labels_)}, y:{json.dumps(values_)}, type:'bar'}}], "
            f"{{xaxis:{{automargin:true}}, yaxis:{{title:'Selections'}}, margin:{{t:10,r:10,b:60,l:40}}}});"
        )

    # text
    n = int(spec.params.get("ngram", 1))
    top_k = int(spec.params.get("top_k", 20))
    labels__, values__ = ngram_counts(answers, n=n, top_k=top_k)
    return (
        f"Plotly.newPlot('{el}', [{{x:{json.dumps(labels__)}, y:{json.dumps(values__)}, type:'bar'}}], "
        f"{{xaxis:{{automargin:true}}, yaxis:{{title:'Frequency'}}, margin:{{t:10,r:10,b:60,l:40}}}});"
    )

def build_tiles_html(title: str, description: str, records: List[QuestionRecord], specs: List[ChartSpec], include_header: bool) -> Tuple[str, str]:
    """
    Returns (tiles_html, scripts_js)
    - tiles_html: a set of themed tiles (no global CSS)
    - scripts_js: the JS that initializes Plotly on each tile
    """
    tiles = []
    scripts = []
    if include_header:
        tiles.append(
            f'<div class="md:col-span-12"><h2 class="text-xl font-semibold">{html.escape(title or "")}</h2>'
            f'<p class="text-sm text-muted-foreground mt-1">{html.escape(description or "")}</p></div>'
        )

    for i, (rec, spec) in enumerate(zip(records, specs)):
        t = html.escape(spec.title or rec.label)
        d = html.escape(spec.description or "")
        ins = html.escape(insight_text(rec.label, rec.answers, rec.answer_type))
        chart_id = f"chart-{i}"
        tiles.append(
            f"""
<div class="{tile_class(spec.size)}">
  <div class="h-full flex flex-col">
    <div class="{HEADER_ROW_CLASS}">
      <!-- Optional icon slot; keep structure compatible with your BentoTile -->
      <h3 class="{TITLE_CLASS}">{t}</h3>
    </div>
    <div class="{BODY_CLASS}">
      <p class="{DESC_CLASS}">{d}</p>
      <div id="{chart_id}" class="w-full" style="height:280px"></div>
    </div>
    <div class="mt-3 flex items-center justify-between">
      <div class="text-xs text-muted-foreground">{ins}</div>
      <button class="{BTN_CLASS}" onclick="(function(){{if(!window.Plotly)return;Plotly.toImage('{chart_id}',{{format:'png',height:600,width:1000}}).then(u=>{{let a=document.createElement('a');a.href=u;a.download='{t}'.replaceAll(' ','_')+'.png';a.click();}})}})()">Download PNG</button>
    </div>
  </div>
</div>
""".strip()
        )
        scripts.append(render_trace_js(i, rec.label, rec.answers, rec.answer_type, spec))

    return "\n".join(tiles), "\n".join(scripts)

def html_full_page(title: str, description: str, tiles_html: str, scripts_js: str) -> str:
    # Full page includes Plotly CDN and a minimal dark bg, but still uses your classes.
    title_h = html.escape(title or "Survey Dashboard")
    desc_h = html.escape(description or "")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title_h}</title>
<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
</head>
<body class="min-h-screen bg-background text-foreground">
  <section class="container mx-auto px-4 py-6">
    <header class="mb-4">
      <h1 class="text-2xl font-bold">{title_h}</h1>
      <p class="text-sm text-muted-foreground mt-1">{desc_h}</p>
    </header>
    <div class="grid grid-cols-12 gap-4">
      {tiles_html}
    </div>
  </section>
<script>
{scripts_js}
</script>
</body>
</html>
"""

def html_fragment(tiles_html: str, scripts_js: str) -> str:
    """
    Fragment to embed inside your page. It:
    - wraps tiles in a grid container using Tailwind utility classes
    - loads Plotly only if not already present, then runs scripts
    """
    loader = """
<script>
(function(){
  function run(){ %SCRIPTS% }
  if (window.Plotly) { run(); return; }
  var s = document.createElement('script');
  s.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
  s.onload = run;
  document.head.appendChild(s);
})();
</script>
""".replace("%SCRIPTS%", scripts_js)
    return f"""
<div class="grid grid-cols-12 gap-4">
{tiles_html}
</div>
{loader}
""".strip()


# =========================
# Orchestration (one-shot)
# =========================

def load_grouped_from_retrieve(form_id: str) -> Tuple[str, str, List[QuestionRecord]]:
    """Uses retrieve_supabase2.py to fetch bundle, convert to grouped, then adapt to records."""
    config = r2.load_config()
    bundle = r2.fetch_form_bundle(config, form_id)
    grouped = r2.bundle_to_grouped_by_question(bundle)
    title = grouped.get("title") or ""
    description = grouped.get("description") or ""
    records: List[QuestionRecord] = []
    for q in grouped.get("questions", []):
        label = q.get("question")
        answers = q.get("answers") or []
        atype = detect_type(answers)
        records.append(QuestionRecord(label=label, answers=answers, answer_type=atype))

    return title, description, records


def generate_dashboard(
    form_id: str,
    *,
    fragment: bool = False,
    use_llm: bool = True,
) -> DashboardRender:
    """Render the dashboard HTML string along with handy metadata."""
    title, description, records = load_grouped_from_retrieve(form_id)

    client = init_llm() if use_llm else None
    specs: List[ChartSpec] = []
    for rec in records:
        spec = ask_llm(client, rec.label, rec.answer_type, rec.answers)
        if spec is None:
            spec = fallback_spec(rec.label, rec.answer_type)
        specs.append(spec)

    tiles_html, scripts_js = build_tiles_html(
        title,
        description,
        records,
        specs,
        include_header=not fragment,
    )

    rendered_html = (
        html_fragment(tiles_html, scripts_js)
        if fragment
        else html_full_page(title, description, tiles_html, scripts_js)
    )

    return DashboardRender(
        html=rendered_html,
        title=title,
        description=description,
        question_count=len(records),
    )



def main(argv: Optional[List[str]] = None) -> None:
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--form-id", required=True, help="UUID of the form to render")
    p.add_argument("--out", type=Path, help="Output path (HTML)")
    p.add_argument("--fragment", action="store_true", help="Emit themed tiles fragment (for in-page embedding)")
    p.add_argument("--no-llm", action="store_true", help="Force fallback (ignore LLM planning)")
    p.add_argument("--stdout", action="store_true", help="Write rendered HTML to stdout instead of a file")
    args = p.parse_args(argv)

    render = generate_dashboard(
        args.form_id,
        fragment=args.fragment,
        use_llm=not args.no_llm,
    )

    if args.stdout:
        output = render.html if render.html.endswith("\n") else f"{render.html}\n"
        sys.stdout.write(output)
        sys.stdout.flush()
        return

    default_name = (
        f"dashboard_fragment_{args.form_id}.html"
        if args.fragment
        else f"dashboard_{args.form_id}.html"
    )
    out_path = args.out or (Path.cwd() / default_name)
    out_path.write_text(render.html, encoding="utf-8")

    if args.fragment:
        print(f"✅ Wrote themed fragment: {out_path}")
    else:
        print(f"✅ Wrote full dashboard: {out_path}")


if __name__ == "__main__":
    main()
