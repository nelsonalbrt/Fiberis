from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

RULES = (
    ("CORE_USAGE", r"\b(core|pemakaian core)\b"),
    ("DEVICE", r"perangkat|dwdm|zte|router|switch|node"),
    ("SPLICE", r"splice|splicing|sambung"),
    ("CHANGE_OVER", r"change.?over|cut.?over|aktivitas co"),
    ("INCIDENT", r"gangguan|incident|trouble|fo cut|congestion"),
    ("ROUTE", r"route|rute|ruas|jalur|cable|kabel"),
)
STATUS = {
    "terpakai": "IN_USE", "used": "IN_USE", "in use": "IN_USE",
    "idle": "AVAILABLE", "available": "AVAILABLE", "kosong": "AVAILABLE",
    "rusak": "BROKEN", "broken": "BROKEN", "down": "BROKEN",
    "kritis": "CRITICAL", "critical": "CRITICAL",
}


def classify_sheet(name: str, workbook: str = "") -> str | None:
    text = re.sub(r"\s+", " ", name).casefold()
    direct = next((kind for kind, pattern in RULES if re.search(pattern, text)), None)
    if direct:
        return direct
    if "pemakaian core" in workbook.casefold() and not re.search(r"action|rekap|ophar|warna", text):
        return "CORE_USAGE"
    return None


def status_target(value: str) -> str:
    return STATUS.get(re.sub(r"\s+", " ", value).strip().casefold(), "UNKNOWN")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate candidate domain mapping; never publishes data")
    parser.add_argument("audit", type=Path)
    parser.add_argument("preview", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    audit = json.loads(args.audit.read_text(encoding="utf-8"))
    preview = json.loads(args.preview.read_text(encoding="utf-8"))
    preview_by_file = {w["file"]: w for w in preview["workbooks"]}
    candidates = []
    counts = Counter()
    for workbook in audit["workbooks"]:
        for sheet in workbook["sheets"]:
            domain = classify_sheet(sheet["name"], workbook["file"])
            if not domain:
                continue
            counts[domain] += 1
            source = preview_by_file.get(workbook["file"], {})
            candidates.append({
                "workbook": workbook["file"], "sha256": workbook["sha256"],
                "sheet": sheet["name"], "domain": domain,
                "header_row": sheet["header_row"],
                "headers": sheet["headers"],
                "candidate_keys": sheet["candidate_keys"],
                "state": sheet["state"],
                "authoritative": False,
                "decision": "REVIEW_REQUIRED",
                "reason": "Candidate only; key, status rule, and owner approval missing.",
                "preview_available": bool(source),
            })
    report = {
        "mode": "DOMAIN_MAPPING_PREVIEW",
        "publish_enabled": False,
        "approval_enabled": False,
        "source_hashes": [{"file": w["file"], "sha256": w["sha256"]} for w in audit["workbooks"]],
        "summary": {"candidates": len(candidates), "by_domain": dict(counts), "unresolved": len(candidates)},
        "status_mapping": {"TERPAKAI": "IN_USE", "IDLE": "AVAILABLE", "RUSAK": "BROKEN", "KRITIS": "CRITICAL", "OTHER": "UNKNOWN"},
        "candidates": candidates,
        "notice": "No authoritative sheet selected. No source row normalized or published.",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
