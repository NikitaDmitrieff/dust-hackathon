"""Export a Supabase form grouped by question (answers array per question)."""

from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv


# ------------------------------
# Config
# ------------------------------

@dataclass
class SupabaseConfig:
    url: str
    key: str
    forms_table: str = "form"
    questions_table: str = "question"
    answers_table: str = "answer"


def load_config() -> SupabaseConfig:
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in environment (.env).")
    return SupabaseConfig(
        url=url,
        key=key,
        forms_table=os.getenv("FORMS_TABLE", "form"),
        questions_table=os.getenv("QUESTIONS_TABLE", "question"),
        answers_table=os.getenv("ANSWERS_TABLE", "answer"),
    )


# ------------------------------
# REST helpers (with optional pagination)
# ------------------------------


def _endpoint(config: SupabaseConfig, table: str) -> str:
    return f"{config.url.rstrip('/')}/rest/v1/{table}"


def _headers(config: SupabaseConfig) -> Dict[str, str]:
    return {
        "apikey": config.key,
        "Authorization": f"Bearer {config.key}",
        "Accept": "application/json",
    }


def _get_with_retries(
    url: str,
    headers: Dict[str, str],
    params: Dict[str, Any],
    range_hdr: Optional[str] = None,
    retries: int = 3,
    use_range: bool = True,
) -> requests.Response:
    h = dict(headers)
    if use_range and range_hdr:
        h["Range-Unit"] = "items"
        h["Range"] = range_hdr
    last_err = None
    for i in range(retries):
        try:
            resp = requests.get(url, headers=h, params=params, timeout=30)
            if resp.status_code in (200, 206):
                return resp
            if resp.status_code >= 500:
                time.sleep(0.6 * (i + 1))
                continue
            resp.raise_for_status()
            return resp
        except requests.RequestException as e:
            last_err = e
            time.sleep(0.6 * (i + 1))
    raise RuntimeError(f"Supabase request failed after retries: {last_err}")


def _rest_get_all(
    config: SupabaseConfig,
    table: str,
    params: Dict[str, Any],
    page_size: int = 1000,
    use_range: bool = True,
) -> List[Dict[str, Any]]:
    """Fetch rows; if use_range=True, page with Range headers."""
    url = _endpoint(config, table)
    headers = _headers(config)

    if not use_range:
        resp = _get_with_retries(url, headers, params, range_hdr=None, use_range=False)
        data = resp.json()
        if not isinstance(data, list):
            raise RuntimeError(f"Unexpected response from {table}: {data}")
        return data

    out: List[Dict[str, Any]] = []
    start = 0
    while True:
        end = start + page_size - 1
        resp = _get_with_retries(url, headers, params, range_hdr=f"{start}-{end}", use_range=True)
        chunk = resp.json()
        if not isinstance(chunk, list):
            raise RuntimeError(f"Unexpected response from {table}: {chunk}")
        out.extend(chunk)
        if len(chunk) < page_size:
            break
        start += page_size
    return out


# ------------------------------
# Parsing + coercion helpers
# ------------------------------


def _parse_answer_payload(raw_answer: Any) -> Dict[str, Any]:
    """Normalize 'answer' field to {'userName': ..., 'response': ...}."""
    if isinstance(raw_answer, dict):
        return {"userName": raw_answer.get("userName"), "response": raw_answer.get("response")}
    if isinstance(raw_answer, (int, float, bool)) or raw_answer is None:
        return {"userName": None, "response": raw_answer}
    if isinstance(raw_answer, str):
        s = raw_answer.strip()
        if not s:
            return {"userName": None, "response": None}
        try:
            loaded = json.loads(s)
            if isinstance(loaded, dict):
                return {"userName": loaded.get("userName"), "response": loaded.get("response")}
            return {"userName": None, "response": loaded}
        except json.JSONDecodeError:
            return {"userName": None, "response": s}
    return {"userName": None, "response": raw_answer}


def _coerce_value(value_raw, q_type: str):
    """
    Convert raw string/primitive into a typed python value based on question type.
    Keeps arrays for multi-choice; leaves date/datetime as ISO strings.
    """
    if value_raw is None:
        return None
    t = (q_type or "").strip().lower()

    if t in {"multi_choice", "multichoice", "multi-select"}:
        if isinstance(value_raw, list):
            return value_raw
        if isinstance(value_raw, str):
            try:
                j = json.loads(value_raw)
                if isinstance(j, list):
                    return j
            except Exception:
                pass
            return [x.strip() for x in value_raw.split(",") if x.strip()]
        return [value_raw]

    if t in {"choice", "single_choice", "radio"}:
        return value_raw if not isinstance(value_raw, str) else value_raw.strip()

    if t in {"number", "float", "rating"}:
        try:
            return float(value_raw)
        except Exception:
            return value_raw

    if t in {"integer", "int"}:
        try:
            return int(round(float(value_raw)))
        except Exception:
            return value_raw

    if t in {"boolean", "bool"}:
        if isinstance(value_raw, bool):
            return value_raw
        if isinstance(value_raw, (int, float)):
            return bool(value_raw)
        if isinstance(value_raw, str):
            s = value_raw.strip().lower()
            if s in {"true", "yes", "1", "y"}:
                return True
            if s in {"false", "no", "0", "n"}:
                return False
        return value_raw

    # date/datetime/timestamp → keep as string; text default
    if isinstance(value_raw, str):
        return value_raw.strip()
    return value_raw


# ------------------------------
# Domain fetchers (use your column names)
# ------------------------------


def fetch_form_by_id(config: SupabaseConfig, form_id: str) -> Dict[str, Any]:
    rows = _rest_get_all(
        config,
        config.forms_table,
        {"form_id": f"eq.{form_id}", "limit": 1},
        page_size=1,
        use_range=False,  # avoid Range for single fetch
    )
    if not rows:
        raise ValueError(f"Form '{form_id}' not found.")
    return rows[0]


def fetch_questions_for_form(config: SupabaseConfig, form_id: str, page_size: int = 1000) -> List[Dict[str, Any]]:
    params = {"form_id": f"eq.{form_id}", "order": "question_id.asc"}
    return _rest_get_all(config, config.questions_table, params, page_size=page_size, use_range=True)


def fetch_answers_for_question(config: SupabaseConfig, question_id: str, page_size: int = 1000) -> List[Dict[str, Any]]:
    params = {"question_id": f"eq.{question_id}", "order": "answer_id.asc"}
    return _rest_get_all(config, config.answers_table, params, page_size=page_size, use_range=True)


def fetch_form_bundle(config: SupabaseConfig, form_id: str, page_size: int = 1000) -> Dict[str, Any]:
    form_record = fetch_form_by_id(config, form_id)
    questions = fetch_questions_for_form(config, form_id, page_size=page_size)

    question_bundles: List[Dict[str, Any]] = []
    for q in questions:
        q_id = q.get("question_id")
        if not q_id:
            continue
        raw_answers = fetch_answers_for_question(config, q_id, page_size=page_size)
        parsed = [{**a, "parsed_answer": _parse_answer_payload(a.get("answer"))} for a in raw_answers]
        question_bundles.append({"question": q, "answers": parsed})

    return {"form": form_record, "questions": question_bundles}


# ------------------------------
# Transform → grouped-by-question (with title + description)
# ------------------------------


def bundle_to_grouped_by_question(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """
    Output:
    {
      "title": "...",
      "description": "...",
      "questions": [
        { "question": "Label", "answers": [ <typed>, <typed>, ... ] },
        ...
      ]
    }
    """
    form = bundle.get("form", {})
    title = form.get("title")
    description = form.get("description")

    grouped: List[Dict[str, Any]] = []
    for qb in bundle.get("questions", []):
        q = qb.get("question", {})
        label = q.get("question")
        q_type = q.get("type_answer")

        answers_list: List[Any] = []
        for ans in qb.get("answers", []):
            pa = ans.get("parsed_answer") or {}
            value_raw = pa.get("response")
            value = _coerce_value(value_raw, q_type)
            answers_list.append(value)

        grouped.append({"question": label, "answers": answers_list})

    return {"title": title, "description": description, "questions": grouped}


# ------------------------------
# Save helpers
# ------------------------------


def default_output_path(form_id: str, directory: Optional[Path] = None) -> Path:
    directory = directory or Path.cwd()
    ts = time.strftime("%Y%m%d-%H%M%S")
    return directory / f"form_grouped_{form_id}_{ts}.json"


def save_grouped_output(config: SupabaseConfig, form_id: str, output_path: Path) -> Path:
    bundle = fetch_form_bundle(config, form_id)
    grouped = bundle_to_grouped_by_question(bundle)
    output_path.write_text(json.dumps(grouped, indent=2))
    return output_path


# ------------------------------
# CLI / interactive entrypoint
# ------------------------------


def parse_argv(argv: List[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Flags:
      --form-id <id>
      --out <file>
    """
    form_id: Optional[str] = None
    out: Optional[str] = None
    i = 0
    while i < len(argv):
        tok = argv[i]
        if tok == "--form-id" and i + 1 < len(argv):
            form_id = argv[i + 1]; i += 2
        elif tok == "--out" and i + 1 < len(argv):
            out = argv[i + 1]; i += 2
        else:
            i += 1
    return form_id, out


def main() -> None:
    config = load_config()
    form_id, out = parse_argv(sys.argv[1:])

    if not form_id:
        try:
            form_id = input("Enter form_id to export: ").strip()
        except EOFError:
            form_id = ""
    if not form_id:
        raise SystemExit("No form_id provided. Aborting.")

    # quick sanity check: can we hit the table?
    _ = _rest_get_all(config, config.forms_table, {"select": "form_id", "limit": 1}, page_size=1, use_range=False)

    out_path = Path(out) if out else default_output_path(form_id)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    saved = save_grouped_output(config, form_id, out_path)
    print(f"✅ Saved grouped output to {saved}")


if __name__ == "__main__":
    main()
