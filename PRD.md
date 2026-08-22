# Fiberis — Product Requirements Document

**Status:** Draft
**Produk:** Fiber Optic Path Management System
**Target:** Aplikasi internal, realistis untuk proyek magang
**Sumber kebutuhan:** `Plan.MD`
**Ketergantungan utama:** Audit lokal workbook operasional internal

## 1. Ringkasan Eksekutif

Fiberis memusatkan Data Pemakaian Core dan Dapot Transport yang saat ini diperbarui manual melalui spreadsheet. Karyawan dapat mencari jaringan, mencatat gangguan perangkat seperti congestion control atau kabel FO cut, memperbarui kondisi jaringan, memeriksa pemakaian core, dan melakukan Change Over tervalidasi dari satu dashboard.

Workbook sumber internal tersedia hanya di lingkungan lokal. Struktur, relasi, duplikasi, dan kualitasnya harus diaudit sebelum model data disetujui.

## 2. Masalah

Proses berbasis Excel saat ini:

- pencarian lintas-sheet lambat;
- hubungan jalur sulit ditelusuri;
- status core berpotensi tidak konsisten;
- Change Over rawan konflik dan human error;
- perubahan sulit diaudit secara utuh.

## 3. Tujuan

1. Menjadikan database aplikasi sebagai pusat data operasional setelah migrasi disetujui.
2. Mencari perangkat, kabel, route, atau core.
3. Menampilkan jalur end-to-end dan kondisi terkini.
4. Mencatat serta memperbarui gangguan perangkat dan kabel FO.
5. Menampilkan penggunaan dan ketersediaan core.
6. Memvalidasi Change Over sebelum perubahan.
7. Menyimpan setiap perubahan beserta actor secara permanen.
8. Mengekspor data yang diizinkan ke Excel.

## 4. Non-Goals

- mengganti seluruh sistem operasional perusahaan;
- prediksi gangguan berbasis AI;
- GIS real-time;
- SNMP/OTDR integration;
- network automation;
- digital twin;
- sinkronisasi dua arah Excel pada MVP.

## 5. Pengguna dan Permission

| Role | View | Search | Change Over | Master Data | User Management | Export | Audit Log |
|---|---:|---:|---:|---:|---:|---:|---:|
| Viewer | Ya | Ya | Tidak | Tidak | Tidak | Sesuai kebijakan | Tidak |
| Operator/Teknisi | Ya | Ya | Ya | Tidak | Tidak | Sesuai kebijakan | Riwayat terkait |
| Admin | Ya | Ya | Ya | Ya | Ya | Ya | Ya |

Permission final harus mengikuti kebijakan internal perusahaan.

## 6. Scope MVP

### Must Have

- autentikasi dan role-based authorization;
- import workbook melalui staging dan validasi;
- pencarian perangkat, kabel, route, dan core;
- detail perangkat dan jalur terkait;
- visualisasi path sebagai graph;
- dashboard status jaringan;
- pencatatan dan pembaruan incident perangkat/kabel;
- daftar pemakaian/status core;
- preview dan validasi Change Over;
- commit Change Over dalam satu database transaction;
- immutable history/audit event;
- laporan import error;
- export Excel terbatas sesuai permission.

### Should Have

- dashboard ringkas;
- filter dan pagination;
- alasan Change Over wajib;
- status gangguan jika didukung data;
- soft delete master data yang memang boleh dinonaktifkan.

### Nice to Have

- penyimpanan preset pencarian;
- visual diff route lama dan baru;
- export riwayat terfilter.

### Out of Scope

Semua non-goals pada bagian 4 dan fitur yang tidak didukung workbook atau kebutuhan operasional nyata.

## 7. User Stories dan Acceptance Criteria

### US-01 — Search

Sebagai pengguna, saya dapat mencari identifier/nama perangkat, kabel, route, atau core.

**Diterima bila:**
- hasil hanya memuat data yang boleh dilihat user;
- pencarian menghasilkan tipe entitas dan identifier yang jelas;
- empty state dan input invalid ditangani;
- target respons awal: p95 < 2 detik pada volume hasil audit.

### US-02 — View Path

Sebagai pengguna, saya dapat melihat jalur dari perangkat asal ke tujuan.

**Diterima bila:**
- node dan hubungan berasal dari data tersimpan;
- segmen yang tidak lengkap ditandai, bukan direka;
- detail kabel/core dapat dibuka dari graph;
- tampilan tabel tersedia sebagai fallback aksesibilitas.

### US-03 — Check Core

Sebagai operator, saya dapat melihat core aktif, tersedia, tidak valid, dan endpoint-nya.

**Diterima bila:**
- status ditentukan oleh rule terdokumentasi;
- penggunaan ganda atau relasi orphan ditandai konflik;
- data ambigu tidak ditampilkan sebagai tersedia.

### US-04 — Change Over Preview

Sebagai operator, saya dapat memilih jalur/core proteksi dan melihat validasi tanpa mengubah data.

**Diterima bila:**
- sistem mengembalikan semua validation failure;
- preview menunjukkan old state dan proposed state;
- preview memiliki token/version untuk mencegah stale update.

### US-05 — Commit Change Over

Sebagai operator, saya dapat mengonfirmasi Change Over valid.

**Diterima bila:**
- authorization dicek ulang saat commit;
- validasi dijalankan ulang dalam transaction;
- konflik concurrent update menggagalkan seluruh perubahan;
- old/new assignment dan alasan tersimpan;
- tidak ada partial update.

### US-06 — History

Sebagai user berizin, saya dapat melihat siapa mengubah apa dan kapan.

**Diterima bila:**
- history memuat actor, timestamp, alasan, status, old/new route dan core;
- history tidak dapat diedit atau dihapus lewat aplikasi;
- akses history mengikuti permission.

### US-07 — Import

Sebagai admin, saya dapat mengimpor snapshot workbook tanpa merusak production data.

**Diterima bila:**
- file masuk staging;
- semua sheet yang relevan diproses;
- error dilaporkan per sheet/baris/field tanpa memuat data sensitif berlebihan;
- invalid row tidak masuk production;
- publish hanya terjadi setelah validation gate lulus.

## 8. Kebutuhan Non-Fungsional

### Integritas

- foreign key, unique constraint, dan check constraint digunakan bila datanya mendukung;
- Change Over memakai database transaction dan concurrency control;
- import bersifat repeatable/idempotent untuk file yang sama;
- timezone dan format timestamp ditetapkan sebelum implementasi.

### Keamanan

- deployment internal;
- TLS untuk traffic jaringan;
- password di-hash dengan mekanisme framework;
- session/token aman;
- least privilege;
- server-side validation;
- file upload dibatasi tipe, ukuran, dan lokasi;
- secret di secret store/environment, bukan repository;
- log tidak memuat data workbook mentah.

### Operasional

- backup dan restore database diuji;
- health check tersedia;
- structured log dengan request/correlation ID;
- audit event terpisah dari application log;
- error pengguna tidak mengekspos stack trace.

### Usability

- graph bukan satu-satunya cara membaca path;
- keyboard navigation dan label form tersedia;
- validasi menjelaskan alasan dan tindakan perbaikan.

## 9. Metrik Keberhasilan

Baseline diukur saat audit dan user testing.

- median waktu menemukan path turun dibanding Excel;
- 100% Change Over tercatat dengan actor dan old/new state;
- 0 assignment core ganda yang lolos constraint/rule;
- 0 partial update pada simulasi kegagalan Change Over;
- semua invalid import row muncul di laporan error;
- user operasional menyelesaikan skenario utama tanpa bantuan developer.

## 10. Risiko Produk

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Workbook tidak punya key stabil | Relasi dan import tidak aman | Profiling, mapping table, surrogate key dengan natural-key constraint |
| Makna status/core ambigu | Change Over salah | Workshop domain dan rule approval sebelum implementasi |
| Workbook berubah format | Import gagal/keliru | Template version, schema validation, fail closed |
| Concurrent operator | Double allocation | Row lock/version check dan unique constraint |
| Graph terlalu kompleks | UI sulit dipakai | Fokus path terpilih; tabel fallback |

## 11. Definition of Done MVP

MVP selesai bila:

- audit workbook disetujui pemilik data;
- model data dan rule Change Over disetujui domain owner;
- semua Must Have tersedia;
- test unit, integration, import, authorization, dan transaction lulus;
- backup/restore dan deployment runbook diuji;
- tidak ada temuan keamanan Critical/High terbuka;
- user acceptance test untuk skenario kabel putus lulus;
- dokumentasi operator/admin tersedia;
- workbook asli tidak pernah dimodifikasi.
