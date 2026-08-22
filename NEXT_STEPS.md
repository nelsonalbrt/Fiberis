# Fiberis — Lanjutan dan Pekerjaan Belum Selesai

## Status Saat Ini

Prototype lokal siap untuk testing memakai data sintetis.

Sudah tersedia:

- login dan RBAC `ADMIN`, `OPERATOR`, `VIEWER`;
- navigasi read-only untuk Viewer;
- dashboard kondisi jaringan;
- pencarian asset dan visualisasi path sintetis;
- core inventory dan export CSV;
- incident create, resolve, dan history;
- Change Over preview, validasi, commit, dan history;
- import workbook preview-only;
- candidate domain mapping tanpa publish;
- review candidate mapping khusus Admin, terikat workbook/sheet/SHA-256;
- password lokal melalui `.env` dan hash `scrypt`;
- test Node dan Python;
- repository Git bersih tanpa workbook, audit mentah, runtime data, graph output, atau secret.

## Batas Prototype

Belum production-ready karena:

- data operasional belum dipublikasikan;
- authoritative source belum dipilih;
- composite key belum disetujui;
- status dan aturan deduplikasi belum final;
- persistence masih JSON lokal, bukan database production;
- approval import belum tersedia;
- authentication masih lokal, belum SSO perusahaan;
- belum ada deployment, backup/restore, monitoring, dan UAT formal.

## Prioritas 1 — Keputusan Domain

Selesaikan sebelum menulis publish importer atau schema final.

1. Pilih authoritative source untuk:
   - perangkat;
   - kabel/route;
   - pemakaian core;
   - splice;
   - incident;
   - Change Over.
2. Tetapkan composite key untuk perangkat, kabel, route, dan core.
3. Tetapkan definisi resmi:
   - `IN_USE`;
   - `AVAILABLE`;
   - `BROKEN`;
   - `CRITICAL`;
   - `UNKNOWN`.
4. Putuskan arti nilai kosong.
5. Putuskan aturan duplicate: `SKIP`, `MERGE`, pilih versi terbaru, atau `ERROR`.
6. Tetapkan active/protection path dan core reservation rule.
7. Catat keputusan dan approver di `DECISIONS.md`.

Gate selesai:

- setiap domain punya authoritative source;
- setiap entity punya approved key;
- setiap status sumber punya target atau `UNKNOWN`;
- tidak ada asumsi Critical yang belum dijawab.

## Prioritas 2 — Normalized Import Preview

Setelah Prioritas 1 disetujui:

1. Tambah mapping configuration berbasis source hash.
2. Normalisasi row staging menjadi candidate entity.
3. Klasifikasikan setiap row:
   - `CREATE`;
   - `UPDATE`;
   - `SKIP`;
   - `ERROR`.
4. Tampilkan duplicate, missing key, invalid status, dan broken relation.
5. Buat reconciliation totals per entity dan source.
6. Tambah approval khusus Admin yang terikat ke batch hash dan mapping version.
7. Perubahan file atau mapping wajib membatalkan approval lama.

Gate selesai:

- preview deterministik untuk file dan mapping sama;
- invalid row tidak hilang diam-diam;
- approval tidak berlaku untuk batch yang berubah;
- endpoint publish tetap tidak aktif sebelum seluruh gate lulus.

## Prioritas 3 — Database dan Transactional Publish

Kerjakan hanya setelah normalized preview diterima.

1. Pilih PostgreSQL atau database internal yang disetujui.
2. Buat schema minimum dengan PK, FK, unique, check, dan index.
3. Buat tabel import batch, staging, error, approval, dan history.
4. Implement publish dalam satu transaction.
5. Tambah idempotency berdasarkan batch hash.
6. Tambah rollback test dan duplicate-publish test.
7. Pertahankan data sintetis sebagai mode demo terpisah.

Gate selesai:

- valid batch publish satu kali;
- batch sama tidak menggandakan data;
- failure tidak menghasilkan partial write;
- reconciliation sebelum dan sesudah publish cocok.

## Prioritas 4 — Production Hardening

1. Integrasikan SSO/LDAP/OIDC bila tersedia.
2. Tambah user management dan approval permission khusus Admin.
3. Tambah audit actor, timestamp, before/after snapshot, dan correlation ID.
4. Tambah upload limits, file type validation, rate limits, dan safe errors.
5. Tambah backup, restore test, retention, monitoring, dan alert.
6. Tambah integration, E2E, accessibility, security, dan performance tests.
7. Siapkan TLS dan environment internal.

## Prioritas 5 — UAT

Skenario minimum:

1. Viewer mencari perangkat, route, dan core tanpa akses write.
2. Operator membuat dan menyelesaikan incident.
3. Operator melihat impacted path dan core.
4. Change Over invalid ditolak tanpa perubahan.
5. Change Over valid tercatat atomik di history.
6. Admin melihat import preview dan approval report.
7. Batch invalid tidak dapat dipublikasikan.
8. Export hanya memuat field yang diizinkan.
9. Dashboard cocok dengan reconciliation report.
10. Backup dapat direstore dan aplikasi lulus smoke test.

## Perintah Lokal

```bash
npm test
cd tools && uv run --with openpyxl python -m unittest test_generate_domain_mapping.py test_preview_import.py
cd ..
npm start
```

Buka `http://127.0.0.1:3000`.

## GitHub

Sebelum push:

```bash
git status
git log --oneline --all
git ls-tree -r --name-only HEAD
```

Push history bersih secara manual:

```bash
git push --force-with-lease origin main
```

Jangan tambahkan `Sumber data excel/`, `audit/`, `data/`, `graphify-out/`, `Plan.MD`, atau `.env` ke Git.
