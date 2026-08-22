# Fiberis — Decisions, Assumptions, and Open Questions

Dokumen ini mencegah asumsi berubah diam-diam menjadi fakta.

## Status

- `ACCEPTED`: disetujui dan berlaku.
- `PROVISIONAL`: pilihan kerja; dapat berubah setelah audit/konfirmasi.
- `OPEN`: butuh jawaban.
- `REJECTED`: sengaja tidak dipakai.

## Decisions

| ID | Status | Decision | Reason / Trigger to Revisit |
|---|---|---|---|
| D-001 | ACCEPTED | MVP fokus `SEARCH → VIEW PATH → CHECK CORE → CHANGE OVER → SAVE HISTORY` | Batas proyek tetap realistis |
| D-002 | ACCEPTED | Workbook asli read-only dan data tidak keluar lingkungan internal | Kerahasiaan dan integritas data |
| D-003 | ACCEPTED | Invalid import masuk error report; tidak silent drop | Traceability |
| D-004 | ACCEPTED | Change Over wajib transaction, revalidation, concurrency control, dan immutable history | Mencegah partial/double allocation |
| D-005 | PROVISIONAL | Modular monolith | Scope MVP tidak membenarkan microservices |
| D-006 | PROVISIONAL | PostgreSQL sebagai database | Constraint, lock, transaction, recursive query |
| D-007 | PROVISIONAL | React + TypeScript + React Flow | Graph UI dan maintainability |
| D-008 | PROVISIONAL | Laravel sebagai backend | Delivery cepat; ganti Spring Boot bila standar/skill organisasi lebih kuat |
| D-009 | ACCEPTED | Graph database tidak dipakai pada MVP | Relational model cukup sampai traversal kompleks terbukti |
| D-010 | ACCEPTED | Staging terpisah sebelum production publish | Validasi dan reconciliation |
| D-011 | ACCEPTED | Data test dan dokumentasi harus sintetis | Cegah kebocoran data nyata |
| D-012 | ACCEPTED | Graph punya table fallback | Accessibility dan troubleshooting |
| D-013 | ACCEPTED | Database aplikasi menjadi pusat data setelah migrasi dan rekonsiliasi disetujui | Menghentikan update operasional tersebar di spreadsheet |
| D-014 | ACCEPTED | Gangguan dimodelkan sebagai incident, bukan overwrite status tanpa riwayat | Menjaga siapa, kapan, penyebab, dampak, dan resolusi |
| D-015 | ACCEPTED | Development boleh lanjut memakai data sintetis setelah audit struktural | UI/workflow tidak perlu menunggu pembersihan data |
| D-016 | ACCEPTED | Final schema core/path dan production import ditahan sampai authoritative sheet, composite key, dan status rule disetujui | Audit menemukan layout multi-header, backup/copy, duplikasi, dan key tidak stabil |
| D-017 | ACCEPTED | Workbook sumber tidak boleh direct import ke production | Wajib staging, mapping per keluarga sheet, validation, dan reconciliation |

## Assumptions Requiring Audit

| ID | Status | Assumption | Validation |
|---|---|---|---|
| A-001 | OPEN | Workbook memiliki identifier untuk perangkat/kabel/route/core | Profil candidate key seluruh sheet |
| A-002 | OPEN | Nomor core unik dalam scope satu kabel | Duplicate analysis per cable/core |
| A-003 | OPEN | Active usage dapat dibedakan dari available/reserved/faulty | Analisis nilai, formula, dan konfirmasi domain |
| A-004 | OPEN | Endpoint dan urutan route dapat direkonstruksi | Relationship dan continuity analysis |
| A-005 | OPEN | Protection path/core direpresentasikan atau dapat diturunkan aman | Audit mapping dan domain rule |
| A-006 | OPEN | Splice data tersedia dan cukup untuk traversal | Inventory dan pair validation |
| A-007 | OPEN | Volume data cocok untuk PostgreSQL search tanpa search engine | Row count dan query benchmark |

## Open Questions — Domain

1. Apa definisi tepat `route`, `ruas`, `jalur`, `kabel`, dan `core`?
2. Dalam scope apa nomor core unik?
3. Apa rule resmi core `AVAILABLE`?
4. Apakah cell kosong berarti available, unknown, atau data missing?
5. Bagaimana pasangan active/protection ditentukan?
6. Apakah protection core boleh reserved untuk layanan tertentu?
7. Kondisi apa yang membuat route/core tidak boleh dipilih?
8. Apakah satu Change Over dapat memindahkan beberapa assignment sekaligus?
9. Apakah approval kedua diperlukan sebelum commit?
10. Bagaimana rollback bisnis dilakukan setelah Change Over committed?
11. Berapa lama history, import file, dan export file disimpan?
12. Field apa yang boleh diekspor oleh tiap role?

## Open Questions — Technical/Operational

1. Apakah perusahaan punya SSO/LDAP/OIDC?
2. Apakah backend wajib Laravel atau Spring Boot menurut standar internal?
3. Environment deployment: Windows Server, Linux VM, container, atau lainnya?
4. Berapa jumlah user aktif dan concurrent operator?
5. Berapa target ukuran workbook dan frekuensi import?
6. Apakah Excel tetap diedit setelah go-live? Jika ya, siapa source of truth?
7. Apakah import bersifat initial migration saja atau berkala?
8. Apa RPO/RTO database?
9. Siapa domain owner yang menyetujui audit dan rule Change Over?
10. Siapa yang berhak melihat raw import errors?

## Rejected Until Needed

| Item | Status | Reason |
|---|---|---|
| Microservices | REJECTED | Menambah deployment dan transaction complexity |
| Kubernetes | REJECTED | Tidak diperlukan untuk MVP internal |
| Graph database | REJECTED | Belum ada traversal yang membutuhkan |
| Elasticsearch | REJECTED | PostgreSQL search diuji lebih dulu |
| Kafka/event broker | REJECTED | Tidak ada async integration nyata |
| AI/GIS/SNMP/OTDR/digital twin | REJECTED | Out of scope dan tidak didukung kebutuhan/data saat ini |

## Approval Record

| Date | Document/Decision | Approver | Result | Notes |
|---|---|---|---|---|
| PENDING | Phase 0 audit | PENDING | PENDING | Workbook belum tersedia |
| PENDING | Data model dan constraints | PENDING | PENDING | Menunggu audit |
| PENDING | Change Over rules | PENDING | PENDING | Menunggu domain owner |
| PENDING | MVP scope dan stack | PENDING | PENDING | Menunggu persetujuan |
