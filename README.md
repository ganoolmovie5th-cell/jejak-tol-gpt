# SakuKartu — Struk Tol

Website pencarian transaksi tol berdasarkan nomor kartu, tanggal, dan operator. Responsif untuk iPhone, Android, dan desktop; tanpa NFC atau instalasi.

## Fitur
- Astra Tol: Tangerang–Merak (MMS), Jombang–Mojokerto (MHI), Cikopo–Palimanan (LMS).
- Serbaraja: Serpong–Balaraja.
- JTD, BSD Tol, Tol Makassar, Citra Persada, JLB ditandai **Segera**, belum diintegrasikan.
- Pencarian paralel, status masing-masing sumber, filter, urutan, tabel/kartu, pilihan transaksi, pratinjau dan unduhan PDF A4.
- Tidak menyimpan nomor kartu/transaksi di database atau localStorage. POST API dan respons no-store; jangan aktifkan request-body logging di hosting.

## Lokal
Node.js 22 atau lebih baru.

```sh
npm ci
npm test
npm run build
npm run dev
```
Buka http://127.0.0.1:4173. Build ulang setelah mengubah sumber.

## Vercel
Import repository, branch `main`, framework **Other**. `vercel.json` mengatur build `npm run build`, output `dist`, serta fungsi `api/search.js`. Tidak memerlukan environment variable. Pastikan versi Node proyek 22 atau lebih baru. Uji konektivitas operator setelah deployment: akses dari jaringan Vercel dapat berbeda dari jaringan lokal, khususnya port LMS 2001.

## Data dan struk
API server hanya menghubungi origin operator yang ditentukan dalam kode. Periode maksimal 93 hari; Astra menyatakan retensi 30 hari sehingga hasil lebih lama tidak dijamin lengkap. Saldo adalah saldo saat transaksi.

PDF dibuat di browser dari data operator, mengikuti struktur cetak resmi dan memakai logo operator sebagai identitas sumber. PDF ini bukan berkas asli yang diterbitkan operator; kesamaan piksel 100% tidak dijamin. Provenance SakuKartu tercetak di bawah. Tautan ke situs operator tersedia untuk memperoleh salinan langsung. PDF berbasis raster seperti alur cetak Astra, sehingga teksnya tidak dapat diseleksi.

Batas 180 transaksi per PDF untuk membatasi memori perangkat. Pembatas 12 permintaan per menit per instance adalah best effort, bukan pembatas terdistribusi. Untuk trafik besar, gunakan proteksi/rate limit hosting. Tidak ada kunci API operator; endpoint publik bisa berubah atau dibatasi sewaktu-waktu. Tidak ada login, email, atau pengiriman struk otomatis.

## Validasi
Pengujian lokal 3 November 2026 dengan kartu yang diizinkan pemilik: 14 transaksi MMS, 0 MHI, 0 LMS, 1 Serbaraja. Nomor kartu dan respons mentah tidak disertakan dalam repository. Tes otomatis menggunakan data sintetis.

SakuKartu independen dan tidak berafiliasi dengan operator. Logo operator tetap milik pemiliknya. Lihat `docs/operators.md`.
