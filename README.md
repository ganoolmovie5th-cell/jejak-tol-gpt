# SakuKartu

Aplikasi web berbahasa Indonesia untuk pencatatan kartu uang elektronik. Identitas visual asli dengan logo SVG dompet/kartu, warna forest green dan mint. Dibangun dari awal tanpa menyalin kode atau aset CekSaldo.

## Fitur
- Tambah, edit, hapus kartu: e-Money, Flazz, BRIZZI, TapCash, KMT, JakCard, MegaCash.
- Saldo **manual**, ringkasan pengeluaran dan isi saldo bulan berjalan.
- Transaksi dengan pembaruan saldo, pencarian, filter, dan pembatalan transaksi.
- Ekspor CSV (mengikuti filter) dengan mitigasi formula injection; cetak PDF lewat browser.
- Privasi nominal, penyimpanan localStorage, data demo opsional yang ditandai.
- Responsif, dialog native, label formulir, navigasi keyboard.

## Batasan yang disengaja
Browser tidak dapat membaca saldo e-money melalui Web NFC: API NDEF tidak menyediakan low-level ISO-DEP/APDU. Tidak ada scan palsu, top-up fisik, sinkronisasi bank, atau pengambilan struk operator. Untuk pembacaan kartu diperlukan aplikasi native/bridge dan implementasi protokol yang terverifikasi. https://developer.chrome.com/docs/capabilities/nfc

Data hanya ada di browser/perangkat ini, tidak terenkripsi oleh aplikasi, dan dapat hilang saat data browser dihapus. CSV merupakan laporan, bukan format restore. Tidak ada backend, login, telemetry, atau API key. Google Fonts dimuat sebagai resource eksternal dengan font fallback lokal. Batas saldo/nominal pencatatan: Rp1 miliar. Mengedit saldo langsung tidak membuat transaksi penyesuaian. Demo memakai saldo akhir contoh.

## Lokal
Node.js 20+; tidak perlu dependensi.

```sh
npm run dev
# http://127.0.0.1:4173
npm run build
```

## Deploy Vercel
Impor repo ini, pilih framework **Other**, build command `npm run build`, output directory `dist`. Konfigurasi sudah ada di `vercel.json`. Tidak perlu environment variable atau database. Branch produksi: `main`.

## Struktur
`index.html`, `style.css`, `app.js`, `logo.svg` adalah sumber aplikasi; `build.mjs` membuat output statis; `server.mjs` hanya server pengembangan lokal.
