# Fiberis Implementation Plan

> **Untuk Hermes:** Eksekusi task per task setelah pemilik proyek menyetujui dokumen dan Phase 0 selesai.

**Goal:** Menghasilkan MVP internal untuk search, path visualization, core validation, Change Over atomic, dan history.

**Architecture:** Modular monolith dengan React + TypeScript, Laravel, dan PostgreSQL. Workbook masuk lewat staging; production database menjadi source of truth setelah publish.

**Tech Stack:** React, TypeScript, React Flow, Laravel, PostgreSQL, test tooling bawaan stack.

---

## Ground Rules

- Jangan coding sebelum Phase 0 gate lulus.
- Jangan mengubah workbook asli.
- Gunakan data sintetis untuk test/docs.
- Setiap phase memiliki demo dan quality gate.
- Pilih dependency hanya bila native/framework feature tidak cukup.
- Commit kecil berdasarkan outcome, bukan scaffolding kosong.

## Phase 0 — Analysis dan Data Audit

**Tujuan:** Mengubah asumsi menjadi model dan rule yang terverifikasi.

### Tasks

1. Salin workbook ke lokasi audit read-only dan catat SHA-256.
2. Inventaris seluruh sheet, termasuk hidden sheet, dimensions, headers, formulas, merged cells, dan tables.
3. Profil tipe, null, distinct, duplicate, dan candidate key setiap kolom.
4. Uji relasi lintas-sheet dan hitung orphan/match rate.
5. Audit representasi route, cable, core, usage, endpoint, splice, protection, dan status.
6. Buat data quality findings dengan severity.
7. Konfirmasi istilah `AMBIGUOUS` bersama domain owner.
8. Perbarui `DATA_AUDIT.md`, `SYSTEM_DESIGN.md`, dan `DECISIONS.md`.
9. Setujui source-to-target mapping dan MVP scope.

### Gate

- Semua exit criteria `DATA_AUDIT.md` lulus.
- Rule availability dan Change Over tertulis dan disetujui.
- Tidak ada asumsi Critical yang belum terselesaikan.

## Phase 1 — Database dan Import Foundation

**Tujuan:** Membangun schema minimum dan pipeline staging yang dapat diverifikasi.

### Tasks

1. Inisialisasi repository dan framework setelah stack final dipilih.
2. Tambah konfigurasi lokal tanpa secret di repository.
3. Tulis migration untuk entitas yang benar-benar didukung audit.
4. Tambah PK, FK, unique, check, dan index minimum.
5. Tulis test constraint database terlebih dahulu.
6. Buat `import_batches`, staging, dan `import_errors`.
7. Tulis parser workbook read-only dengan fixture sintetis.
8. Tambah schema/type/key/relation validation.
9. Tambah reconciliation report.
10. Implement transactional publish dan idempotency berdasarkan file hash.

### Gate

- Valid fixture masuk production.
- Invalid fixture menghasilkan error lengkap tanpa silent drop.
- Duplicate publish tidak menggandakan data.
- Workbook sumber tidak berubah.

## Phase 2 — Backend Read Path

**Tujuan:** Menyediakan auth, search, detail, incident, path, dan core usage.

### Tasks

1. Implement authentication sesuai keputusan SSO/local.
2. Implement role dan authorization policy.
3. Tulis test authorization matrix.
4. Implement unified search dengan pagination.
5. Implement device/cable/route/core detail yang dibutuhkan UI.
6. Implement incident create/update/resolve dan impacted-resource relation.
7. Implement path projection `nodes`, `edges`, `steps`, `warnings`.
8. Implement core usage/status query.
9. Tambah validation, safe errors, logging, dan correlation ID.
10. Ukur query plan pada volume representatif.

### Gate

- Endpoint hanya mengekspos data berizin.
- Path graph dan table projection konsisten.
- p95 search memenuhi target yang disetujui.

## Phase 3 — Frontend Read Experience

**Tujuan:** Memungkinkan user menyelesaikan Search → View Path → Check Core.

### Tasks

1. Buat shell aplikasi, session handling, dan role-aware navigation.
2. Buat dashboard ringkasan kondisi dan incident aktif.
3. Buat search form dan results.
4. Buat device/route detail serta form incident.
5. Buat path graph dengan React Flow.
6. Buat table fallback dari `steps` yang sama.
7. Buat core usage table dan conflict/unknown states.
8. Tambah loading, empty, error, dan keyboard states.
9. Jalankan accessibility check dan user walkthrough.

### Gate

- Viewer menyelesaikan alur pencarian tanpa akses write.
- Graph dan tabel menampilkan path sama.
- Data `UNKNOWN` terlihat jelas dan tidak tampak available.

## Phase 4 — Change Over

**Tujuan:** Menyelesaikan preview dan commit Change Over dengan integritas penuh.

### Tasks

1. Tulis test validation rule dari rule domain final.
2. Implement preview tanpa mutation.
3. Tambah resource version/staleness token.
4. Tulis integration test concurrent allocation.
5. Implement transaction, deterministic locking, dan revalidation.
6. Tambah constraint untuk single active allocation.
7. Simpan immutable old/new snapshots dan actor.
8. Implement UI selection, validation summary, preview diff, reason, dan confirmation.
9. Implement history list/detail.
10. Uji rollback saat setiap write step gagal.

### Gate

- Invalid/stale/conflicting Change Over selalu gagal tanpa partial update.
- Valid Change Over mengubah assignment dan history dalam satu commit.
- Authorization dicek server-side.

## Phase 5 — Export, Hardening, dan Testing

**Tujuan:** Menutup kebutuhan operasional dan risiko produksi.

### Tasks

1. Implement export terotorisasi memakai template yang disetujui.
2. Tambah retention dan cleanup private file.
3. Jalankan unit, database integration, API, frontend, dan E2E tests.
4. Uji import workbook representatif di lingkungan internal.
5. Lakukan security review untuk auth, upload, authorization, injection, CSRF, dan sensitive logging.
6. Lakukan performance test search/path/Change Over.
7. Lakukan user acceptance test skenario kabel putus.
8. Tulis operator guide dan admin import guide.

### Gate

- Semua Must Have dan Definition of Done pada `PRD.md` lulus.
- Tidak ada temuan Critical/High terbuka.

## Phase 6 — Deployment

**Tujuan:** Deploy internal secara aman dan dapat dipulihkan.

### Tasks

1. Siapkan environment internal, TLS, network policy, dan secret.
2. Jalankan migration pada backup/empty environment lebih dulu.
3. Import data tervalidasi dan review reconciliation.
4. Jalankan smoke test role, search, path, preview, commit test terkontrol, history, dan export.
5. Konfigurasi backup dan lakukan restore test.
6. Aktifkan monitoring dan alert minimum.
7. Training operator/admin.
8. Go-live dengan rollback plan dan owner support jelas.

### Gate

- Restore berhasil.
- Smoke test lulus.
- Domain owner dan technical owner menyetujui go-live.

## Verification Commands

Command final menunggu repository dan stack dibuat. Minimum pipeline nanti wajib mencakup:

```text
backend format/lint
backend unit + integration tests
frontend typecheck + lint + tests
production build
security/dependency scan
migration smoke test
```

Jangan mengarang command sebelum framework version dan package scripts tersedia.

## Milestone Deliverables

| Milestone | Deliverable |
|---|---|
| M0 | Audit, data dictionary, quality report, approved ERD/rules |
| M1 | Database + repeatable import |
| M2 | Auth + search/path/core read interface |
| M3 | Usable frontend read workflow |
| M4 | Atomic Change Over + history |
| M5 | Tested export + security/UAT evidence |
| M6 | Internal deployment + restore evidence |

## Stop Conditions

Hentikan development dan kembali ke domain owner bila:

- core availability tidak dapat ditentukan secara konsisten;
- route endpoint/continuity ambigu;
- key workbook tidak stabil dan tidak ada mapping yang disetujui;
- concurrent update tidak dapat diamankan;
- kebijakan authentication, retention, atau export belum jelas.
