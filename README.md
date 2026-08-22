# Fiberis

Fiber Optic Path Management System untuk pencarian jalur, pemeriksaan pemakaian core, Change Over tervalidasi, dan riwayat perubahan.

## Status

**Prototype siap testing lokal.** Data jaringan masih sintetis; schema dan publish data production belum disetujui.

Workbook internal diaudit lokal tanpa mengubah file asli. Hasil audit dan data sumber tidak disimpan di Git. Model production tetap **PROPOSED** sampai mapping domain disetujui.

## Fokus MVP

`SEARCH → VIEW PATH → CHECK CORE → CHANGE OVER → SAVE HISTORY`

## Dokumen

- [PRD.md](PRD.md) — tujuan, ruang lingkup, kebutuhan, dan acceptance criteria.
- [DATA_AUDIT.md](DATA_AUDIT.md) — prosedur, status, dan gate audit workbook.
- [ARCHITECTURE.md](ARCHITECTURE.md) — pilihan arsitektur dan deployment.
- [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) — model data, interface, workflow, transaksi, dan validasi.
- [EXECUTION_PLAN.md](EXECUTION_PLAN.md) — urutan pengembangan dan quality gates.
- [DECISIONS.md](DECISIONS.md) — keputusan, asumsi, dan pertanyaan terbuka.
- [NEXT_STEPS.md](NEXT_STEPS.md) — pekerjaan belum selesai, prioritas, dan gate lanjutan.

## Aturan Data

1. Workbook asli bersifat read-only.
2. Data nyata tidak masuk source code, dokumentasi, contoh, log, atau commit.
3. Data tidak dikirim ke layanan eksternal.
4. Baris invalid masuk laporan error; tidak dibuang diam-diam.
5. Change Over wajib atomic, tervalidasi, terotorisasi, dan tercatat.

## Prototype untuk Testing

```bash
npm test
npm start
```

Buka `http://127.0.0.1:3000`.

Salin `.env.example` menjadi `.env`, lalu isi password lokal untuk username `operator`, `viewer`, dan `admin`. Jangan commit `.env`.

Prototype mencakup dashboard, RBAC, search, path, core inventory, incident create/resolve, Change Over preview/commit, history, export CSV, dan import Excel preview-only. Password tersimpan sebagai hash scrypt. Data tersimpan lokal di `data/fiberis.json` setelah server dijalankan.

Jalankan ulang import preview:

```bash
uv run --with openpyxl python tools/preview_import.py "path/to/local-input" data/import-preview.json
```

Preview hanya membaca workbook dan membuat report lokal. Tidak ada endpoint publish dan tidak ada row Excel yang masuk dashboard.

## Batas Prototype

- Data jaringan masih sintetis.
- Storage memakai JSON lokal untuk testing, bukan PostgreSQL production.
- Kredensial demo hanya untuk testing lokal dan tidak boleh dipakai di deployment.
- Final schema/import data nyata menunggu mapping domain dan pembersihan workbook.
