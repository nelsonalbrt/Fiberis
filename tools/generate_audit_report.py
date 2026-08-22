from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "audit/audit_summary.json").read_text(encoding="utf-8"))

lines = [
    "# Fiberis — Phase 0 Structural Audit Report", "",
    "**Scope:** Metadata dan profiling agregat; tidak memuat nilai operasional nyata.",
    "**Method:** Pembacaan lokal read-only dengan `openpyxl`; workbook sumber tidak disimpan ulang.", "",
    "## Executive Summary", "",
    f"- {data['totals']['workbooks']} workbook, {data['totals']['sheets']} sheet.",
    f"- {data['totals']['visible_sheets']} visible dan {data['totals']['hidden_sheets']} hidden sheet.",
    f"- {data['totals']['formula_count']:,} formula dan {data['totals']['merged_range_count']:,} merged range.",
    f"- {data['totals']['duplicate_rows_extra']:,} exact duplicate row tambahan pada {data['totals']['sheets_with_duplicates']} sheet.",
    f"- {data['totals']['sheets_without_candidate_key']} dari {data['totals']['sheets']} sheet tidak memiliki single-column candidate key yang aman berdasarkan profiling awal.",
    f"- {data['totals']['unnamed_headers']:,} header kosong, {data['totals']['empty_columns']:,} kolom kosong, dan {data['totals']['mixed_type_columns']:,} kolom bertipe campuran.", "",
    "Kesimpulan: workbook dapat menjadi sumber migrasi, tetapi tidak aman untuk direct import ke tabel production. Staging, mapping per sheet, deduplikasi, dan validasi domain wajib.", "",
    "## Workbook Integrity", "",
    "| Workbook | Bytes | SHA-256 | Sheets |", "|---|---:|---|---:|",
]
for wb in data["workbooks"]:
    lines.append(f"| `{wb['file']}` | {wb['bytes']:,} | `{wb['sha256']}` | {wb['sheet_count']} |")

lines += ["", "## Workbook Inventory", ""]
for wb in data["workbooks"]:
    lines += [f"### {wb['file']}", "", "| Sheet | State | Rows | Cols | Header row* | Formula | Merge | Duplicate extra | Empty cols | Mixed cols |", "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|"]
    for s in wb["sheets"]:
        lines.append(f"| {s['name']} | {s['state']} | {s['rows']} | {s['columns']} | {s['header_row']} | {s['formulas']} | {s['merged_ranges']} | {s['duplicate_rows_extra']} | {s['empty_columns']} | {s['mixed_type_columns']} |")
    lines += ["", "\* Header row adalah hasil heuristik dan wajib dikonfirmasi pada mapping sheet; layout multi-header membuat sebagian hasil ambigu.", ""]

lines += [
    "## Entity Evidence", "",
    "| Concept | Evidence | Confidence |", "|---|---|---|",
    "| Device/transport inventory | Candidate inventory sheets and device fields | INFERRED |",
    "| FO route/path | Candidate route, link, and segment fields | INFERRED |",
    "| Core usage | Candidate core identifiers and usage/status fields | INFERRED |",
    "| Splice | Candidate splice and continuity fields | INFERRED |",
    "| Change Over activity | Candidate operational activity fields | INFERRED |",
    "| Incident history | Candidate ticket, cause, resolution, and timestamp fields | INFERRED |",
    "| Stable cross-sheet primary key | Must be confirmed by local audit | NOT PROVEN |", "",
    "## Data Quality Findings", "",
    "### F-001 — Exact duplicate rows", "",
    f"PROBLEM: {data['totals']['duplicate_rows_extra']} duplicate row tambahan ditemukan pada {data['totals']['sheets_with_duplicates']} sheet.",
    "IMPACT: Double counting dan duplicate allocation dapat masuk ke database.",
    "SEVERITY: High",
    "RECOMMENDATION: Karantina duplicate; pilih survivor hanya dengan rule domain dan provenance.", "",
    "### F-002 — Key tidak stabil", "",
    "PROBLEM: Hampir semua sheet tidak memiliki single-column key yang lengkap dan unik.",
    "IMPACT: Upsert, relasi, dan deduplikasi tidak dapat mengandalkan nomor baris atau nama saja.",
    "SEVERITY: Critical",
    "RECOMMENDATION: Gunakan surrogate key production plus approved composite natural key/source mapping.", "",
    "### F-003 — Layout spreadsheet bukan tabel kanonis", "",
    f"PROBLEM: {data['totals']['unnamed_headers']} header kosong, {data['totals']['empty_columns']} kolom kosong, {data['totals']['merged_range_count']} merged range.",
    "IMPACT: Parser generik berisiko salah memilih header dan memindahkan makna kolom.",
    "SEVERITY: High",
    "RECOMMENDATION: Buat mapping eksplisit per keluarga sheet; fail closed saat layout berubah.", "",
    "### F-004 — Formula dan tipe campuran", "",
    f"PROBLEM: {data['totals']['formula_count']} formula dan {data['totals']['mixed_type_columns']} kolom tipe campuran.",
    "IMPACT: Nilai cached dapat stale; coercion otomatis dapat merusak identifier dan status.",
    "SEVERITY: High",
    "RECOMMENDATION: Simpan raw/formula/cached value di staging dan validasi tipe per field.", "",
    "### F-005 — Hidden/backup/copy sheets", "",
    f"PROBLEM: {data['totals']['hidden_sheets']} hidden sheet dan beberapa sheet bernama Backup/Copy.",
    "IMPACT: Data lama dapat dianggap aktif atau diimpor dua kali.",
    "SEVERITY: High",
    "RECOMMENDATION: Tetapkan authoritative sheet list bersama domain owner; jangan publish backup sheet.", "",
    "## Relationship Analysis", "",
    "Profil nilai menemukan overlap tinggi untuk header seperti `Core ID` pada beberapa sheet core. Ini kandidat relasi, bukan foreign key terbukti. Banyak layout multi-row membuat nilai baris data terbaca sebagai header; relasi otomatis lain ditahan sebagai AMBIGUOUS.", "",
    "## Go/No-Go", "",
    "- **GO:** Kembangkan shell aplikasi, authentication, incident workflow, staging, dan kontrak berbasis data sintetis.",
    "- **NO-GO:** Final schema core/path, Change Over production, dan migrasi data nyata sebelum mapping authoritative, natural key, serta status rule disetujui.", "",
    "## Next Gate", "",
    "1. Domain owner memilih authoritative sheet per keluarga data.",
    "2. Mapping header multi-row dibuat per authoritative sheet.",
    "3. Composite key dan status vocabulary dikonfirmasi.",
    "4. Profil duplicate/orphan dijalankan ulang pada canonical mapping.",
    "5. `SYSTEM_DESIGN.md` difinalkan sebelum migration production.",
]
(ROOT / "audit/PHASE0_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(ROOT / "audit/PHASE0_REPORT.md")
