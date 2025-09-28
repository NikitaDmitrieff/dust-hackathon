from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Dict

from pathlib import Path

# Ensure the project src directory is importable whether the file is executed as a module or a script.
CURRENT_DIR = Path(__file__).resolve().parent
SRC_DIR = CURRENT_DIR.parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from Christopher.bento import DashboardRender, generate_dashboard


def render_to_payload(render: DashboardRender, fragment: bool) -> Dict[str, Any]:
    return {
        "success": True,
        "html": render.html,
        "title": render.title,
        "description": render.description,
        "question_count": render.question_count,
        "fragment": fragment,
    }


def main(argv: None | list[str] = None) -> None:
    parser = argparse.ArgumentParser(description="Generate Bento dashboard JSON payload")
    parser.add_argument("--form-id", required=True, help="UUID of the form to render")
    parser.add_argument("--fragment", action="store_true", help="Emit themed tiles fragment instead of full page")
    parser.add_argument("--no-llm", action="store_true", help="Force fallback charts (skip OpenAI planning)")
    args = parser.parse_args(argv)

    try:
        render = generate_dashboard(
            args.form_id,
            fragment=args.fragment,
            use_llm=not args.no_llm,
        )
    except Exception as exc:  # pragma: no cover - surfaced to caller
        payload = {"success": False, "error": str(exc)}
        json.dump(payload, sys.stdout)
        sys.stdout.write("\n")
        sys.exit(1)

    json.dump(render_to_payload(render, args.fragment), sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
