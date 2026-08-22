from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "audit/workbook_profile.json").read_text(encoding="utf-8"))

result = {"workbooks": [], "totals": {}}
all_sheets = []
for wb in data["workbooks"]:
    sheets = []
    for s in wb["sheets"]:
        empty_columns = sum(c["nonempty"] == 0 for c in s["columns"])
        mixed_columns = sum(len([k for k, v in c["types"].items() if k != "empty" and v]) > 1 for c in s["columns"])
        unnamed = sum(h.startswith("UNNAMED_") for h in s["headers"])
        item = {
            "name": s["name"],
            "state": s["state"],
            "rows": s["rows"],
            "columns": s["columns_count"],
            "header_row": s["header_row"],
            "unnamed_headers": unnamed,
            "empty_columns": empty_columns,
            "mixed_type_columns": mixed_columns,
            "formulas": s["formula_count"],
            "merged_ranges": len(s["merged_ranges"]),
            "duplicate_rows_extra": s["duplicate_rows_extra"],
            "candidate_keys": s["candidate_keys"],
        }
        sheets.append(item)
        all_sheets.append(item)
    result["workbooks"].append({
        "file": wb["file"], "bytes": wb["bytes"], "sha256": wb["sha256"],
        "sheet_count": wb["sheet_count"], "defined_names": wb["defined_names"], "sheets": sheets,
    })

result["totals"] = {
    "workbooks": len(result["workbooks"]),
    "sheets": len(all_sheets),
    "visible_sheets": sum(s["state"] == "visible" for s in all_sheets),
    "hidden_sheets": sum(s["state"] != "visible" for s in all_sheets),
    "rows_dimension_sum": sum(s["rows"] for s in all_sheets),
    "formula_count": sum(s["formulas"] for s in all_sheets),
    "merged_range_count": sum(s["merged_ranges"] for s in all_sheets),
    "duplicate_rows_extra": sum(s["duplicate_rows_extra"] for s in all_sheets),
    "sheets_with_duplicates": sum(s["duplicate_rows_extra"] > 0 for s in all_sheets),
    "sheets_without_candidate_key": sum(not s["candidate_keys"] for s in all_sheets),
    "unnamed_headers": sum(s["unnamed_headers"] for s in all_sheets),
    "empty_columns": sum(s["empty_columns"] for s in all_sheets),
    "mixed_type_columns": sum(s["mixed_type_columns"] for s in all_sheets),
}
result["top_duplicate_sheets"] = sorted(all_sheets, key=lambda s: s["duplicate_rows_extra"], reverse=True)[:15]
result["largest_sheets"] = sorted(all_sheets, key=lambda s: s["rows"] * s["columns"], reverse=True)[:15]
(ROOT / "audit/audit_summary.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(result["totals"], ensure_ascii=False))
