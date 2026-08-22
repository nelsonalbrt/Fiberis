# Fiberis — Workbook Audit Specification

**Status:** TEMPLATE PUBLIK; HASIL AUDIT TETAP LOKAL
**Workbook sumber:** data operasional internal pada folder lokal yang diabaikan Git.
**Hasil:** artefak audit di `audit/` tetap lokal dan tidak boleh diunggah.

Dokumen ini mendefinisikan prosedur audit. Hasil faktual hanya boleh disimpan lokal setelah workbook dibaca secara programatis.

## 1. Guardrails

- Baca salinan workbook sebagai read-only.
- Jangan menyimpan ulang workbook sumber.
- Jangan mengunggah data ke layanan eksternal.
- Jangan mencetak nilai data sensitif ke console/dokumen.
- Contoh laporan memakai nilai sintetis atau hasil agregat.
- Hash file dicatat untuk traceability; file asli tetap tidak berubah.
- Formula dibaca sebagai formula dan cached value secara terpisah.

## 2. Workbook Inventory

| Sheet | Rows | Columns | Header Row | Merged Cells | Formula Count | Classification | Status |
|---|---:|---:|---:|---:|---:|---|---|
| PENDING | — | — | — | — | — | master/transaksi/mapping/rekap/referensi/perhitungan | Belum diaudit |

Audit wajib mencakup seluruh sheet, termasuk hidden/very hidden sheet.

## 3. Profiling Per Sheet

Untuk setiap sheet, catat:

1. dimensi aktual dan used range;
2. posisi header, multi-row header, dan merged header;
3. nama kolom asli dan nama kanonis yang diusulkan;
4. inferred type, format Excel, null count, distinct count;
5. formula, named range, table, filter, dan merged cells;
6. candidate primary key dan alasan;
7. candidate foreign key beserta match rate;
8. duplicate berdasarkan candidate key;
9. pola naming, whitespace, case, separator, dan typo;
10. klasifikasi sheet dan hubungan dengan sheet lain.

## 4. Data Dictionary Template

| Sheet | Original Column | Canonical Meaning | Type | Nullable | Example | Candidate Key | Notes |
|---|---|---|---|---:|---|---:|---|
| PENDING | PENDING | AMBIGUOUS | PENDING | — | Tidak menampilkan data nyata | — | Menunggu audit |

## 5. Relationship Analysis Template

| Parent | Parent Key | Child | Child Key | Cardinality | Match Rate | Orphan Count | Confidence |
|---|---|---|---|---|---:|---:|---|
| PENDING | PENDING | PENDING | PENDING | AMBIGUOUS | — | — | Belum diaudit |

Klasifikasi confidence:

- **FACT:** didukung formula, reference, key match kuat, atau konfirmasi domain owner.
- **INFERRED:** didukung pola data tetapi belum dikonfirmasi.
- **AMBIGUOUS:** lebih dari satu interpretasi masuk akal.

## 6. Pemeriksaan Data Quality

Minimum checks:

- missing value pada field penting;
- duplicate candidate/natural key;
- inconsistent type dan naming;
- duplicate core number dalam scope kabel/segment yang sama;
- core tanpa kabel;
- kabel tanpa route;
- route tanpa endpoint;
- referensi lintas-sheet tidak ditemukan;
- kapasitas kabel tidak cocok dengan core yang terdaftar;
- splice tanpa pasangan/endpoint;
- route/core aktif ganda;
- status bertentangan dengan usage;
- formula error dan broken reference;
- baris/kolom tersembunyi yang memengaruhi makna data.

## 7. Data Quality Finding Format

```text
PROBLEM: <fakta agregat dan lokasi>
IMPACT: <dampak bisnis/teknis>
SEVERITY: Critical | High | Medium | Low
RECOMMENDATION: <perbaikan minimal>
CONFIDENCE: FACT | INFERRED | AMBIGUOUS
```

Severity:

- **Critical:** dapat menyebabkan Change Over salah, kehilangan data, atau assignment core ganda.
- **High:** merusak relasi utama atau membuat path tidak dapat dipercaya.
- **Medium:** menghambat import/search tetapi dapat dikarantina.
- **Low:** kosmetik atau naming tanpa dampak integritas langsung.

## 8. Analisis Khusus Change Over

Audit harus membuktikan representasi:

- perangkat asal dan tujuan;
- route/segment/kabel;
- nomor core dan scope keunikannya;
- active usage;
- status available/reserved/faulty/unknown;
- proteksi dan pasangan service/path;
- splice continuity;
- effective date/version bila ada.

Jika atribut tidak ada, tandai **NOT PRESENT**. Jangan menyimpulkan availability dari cell kosong tanpa rule domain yang disetujui.

## 9. Laporan Audit yang Harus Dihasilkan

Setelah workbook tersedia, dokumen ini diperbarui dengan:

1. Executive Summary faktual.
2. Workbook Inventory lengkap.
3. Data Dictionary.
4. Relationship Analysis.
5. Data Quality Findings.
6. Entitas yang didukung/tidak didukung data.
7. Rule Change Over yang dapat diturunkan.
8. Mapping source-to-staging-to-production.
9. Open questions untuk domain owner.
10. Go/No-Go recommendation untuk development.

## 10. Exit Criteria Phase 0

- seluruh sheet terprofil;
- workbook hash dan audit timestamp tercatat;
- tidak ada sheet diabaikan;
- key dan relasi punya confidence;
- temuan Critical/High punya disposition;
- istilah bisnis ambigu dikonfirmasi;
- model data pada `SYSTEM_DESIGN.md` disesuaikan dengan fakta;
- domain owner menyetujui rule availability dan Change Over.
