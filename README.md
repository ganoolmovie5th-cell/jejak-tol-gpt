# JejakTol — Struk Tol

Repository: https://github.com/ganoolmovie5th-cell/jejak-tol-gpt
Folder lokal: `Downloads/github/jejak-tol-gpt`.

Website pencarian transaksi tol berdasarkan nomor kartu, tanggal, dan operator. Responsif untuk iPhone, Android, dan desktop; tanpa NFC atau instalasi.

## Fitur
- Astra Tol: Tangerang–Merak (MMS), Jombang–Mojokerto (MHI), Cikopo–Palimanan (LMS).
- Serbaraja: Serpong–Balaraja.
- JTD, BSD Tol, Tol Makassar, Citra Persada, JLB tersedia untuk pencarian; CTP Tollways ditandai **Segera**.
- API Citra saat pengujian mengalami timeout. JTD/BSD/Makassar/JLB mengembalikan hasil kosong untuk kartu dan periode yang diizinkan; hasil berisi transaksi masih perlu validasi dengan contoh nyata.
- Pagination BSD/Makassar diambil bertahap. JLB menggunakan cookie dan token CSRF per permintaan.
- JTD menyertakan tautan unduh asli jika diberikan API. PDF gabungan lima operator baru berupa rekap JejakTol, belum reproduksi format resmi.
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
API server hanya menghubungi origin operator yang ditentukan dalam kode. Tidak ada batas total rentang tanggal. Tombol Sejak awal mengisi tanggal 1970-01-01 secara transparan (bukan klaim awal arsip operator). Pencarian berjalan per lima tahun kalender dari terbaru ke terlama, dengan jeda 6,1 detik antarpanggilan, penggabungan ID unik, status kegagalan per periode, dan tombol berhenti yang mempertahankan hasil. Rentang dengan hasil kosong tidak menghentikan pencarian periode sebelumnya. Astra menyatakan retensi 30 hari sehingga hasil lebih lama tidak dijamin lengkap. Saldo adalah saldo saat transaksi.

PDF dibuat di browser dari data operator, mengikuti struktur cetak resmi dan memakai logo operator sebagai identitas sumber. PDF ini bukan berkas asli yang diterbitkan operator; kesamaan piksel 100% tidak dijamin. Asal pembuatan JejakTol tercatat dalam metadata PDF; footer Serbaraja menyebut sumber data dan JejakTol. Header/footer bawaan browser (tanggal cetak, URL about:blank, nomor halaman) pada contoh Serbaraja tidak disalin karena bukan bagian data struk. Tautan ke situs operator tersedia untuk memperoleh salinan langsung. PDF berbasis raster seperti alur cetak Astra, sehingga teksnya tidak dapat diseleksi.

Batas 180 transaksi per PDF untuk membatasi memori perangkat. Pembatas 12 permintaan per menit per instance adalah best effort, bukan pembatas terdistribusi. Untuk trafik besar, gunakan proteksi/rate limit hosting. Tidak ada kunci API operator; endpoint publik bisa berubah atau dibatasi sewaktu-waktu. Tidak ada login, email, atau pengiriman struk otomatis.

## Validasi
Pengujian lokal 3 November 2026 dengan kartu yang diizinkan pemilik: 14 transaksi MMS, 0 MHI, 0 LMS, 1 Serbaraja. Nomor kartu dan respons mentah tidak disertakan dalam repository. Tes otomatis menggunakan data sintetis.

JejakTol independen dan tidak berafiliasi dengan operator. Logo operator tetap milik pemiliknya. Lihat `docs/operators.md`.

## Pemeriksaan responsif

Diperiksa pada viewport 320, 360, 390, 412, dan 768 piksel: tidak ada overflow halaman horizontal. Ponsel memakai tampilan kartu secara default; tabel tetap bisa dipilih dan digulir di dalam panel. Input 16px, kontrol sentuh diperbesar, tanggal ditumpuk pada layar paling sempit. Pratinjau A4 menyesuaikan lebar dialog, dengan tombol Perbesar/Pas layar; ekspor memakai root A4 terpisah. Pencarian, pemilihan transaksi, dan zoom preview diuji di browser desktop pada ukuran mobile, belum di perangkat iOS/Android fisik.

## Vercel Web Analytics

PR #1 dan #2 pemasangan Analytics sudah merged. Loader produksi dan endpoint `/_vercel/insights/script.js` terverifikasi tersedia (HTTP 200) pada 3 November 2026. Pesan dashboard “Error creating pull request” adalah kegagalan alur pembuatan PR, bukan bukti script Analytics belum terpasang; jangan membuat PR pemasangan berulang. Status event pada dashboard belum diverifikasi karena memerlukan login. Analytics dinonaktifkan di localhost; query string dan hash dihapus sebelum pageview dikirim. Jangan mengirim nomor kartu atau detail transaksi sebagai custom event.
