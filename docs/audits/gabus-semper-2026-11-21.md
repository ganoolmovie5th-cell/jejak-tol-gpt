# Gabus dan Semper — 21 November 2026

## Gabus selesai untuk rute teruji

PU feature 185 bernama GT TAMBELANG, koordinat 107.06841181794253,-6.1870613549751186. TomTom Search menemukan dua GT Gabus pada 107.068440,-6.186737 dan 107.068374,-6.186652 (sekitar 36–46 m dari titik PU). Pemkab Bekasi menyebut GT Gabus berada di Desa Srijaya, Tambun Utara; operator menerbitkan tarif aktif Gabus. Kombinasi lokasi, wilayah dan nama operator digunakan untuk memetakan satu fitur itu, bukan mengganti semua nama Tambelang. Nama/status asli PU dipertahankan dalam metadata.

Sumber wilayah: https://www.bekasikab.go.id/jelang-diresmikan-presiden-jokowi-pj-bupati-bekasi-dani-ramdan-tinjau-gerbang-tol-gabus
Sumber tarif: https://www.ctptollways.co.id/tarif

Produksi commit 60346fa: Kantor Kepala Desa Srijaya–Marunda Center melewati GT Gabus–GT Tarumajaya, Rp28.500 dua arah. Bukti respons lengkap: `gabus-2026-11-21.json`. Metland Cibitung–Kantor Desa Srijaya memilih jalan non-tol saat uji, sehingga tidak digunakan sebagai bukti tarif Gabus. 111 tes lulus, build berhasil.

## Semper: aturan ditemukan, integrasi belum selesai

Artikel operator 25 Juli 2023:
https://www.ctptollways.co.id/berita/transaksi-refund-pertama-di-jalan-tol-di-indonesia-912669

Transaksi Marunda saat itu memungut JTCC ditambah JORR; perjalanan menerus JORR tidak melakukan transaksi lagi. Pengguna yang keluar ke arteri Cakung–Cilincing melalui Off Ramp Semper mendapat pengembalian komponen JORR. Angka historis pada artikel tidak digunakan sebagai tarif 2026. Ini menjelaskan mengapa Semper tidak bisa disamakan langsung dengan gerbang tarif JTCC lain.

TomTom Search membedakan GT Semper 1 (-6.139339,106.937900) dan GT Semper 2 (-6.117971,106.925510). Titik PU 194 (-6.134475,106.937251) tidak otomatis dianggap plaza refund terkini. Langkah berikutnya perlu memetakan lintasan ramp/plaza dan membedakan perjalanan menerus JORR dari perjalanan keluar/refund sebelum menghitung komponen tersebut.

Pejagan–Kanci masih belum memiliki pasangan balik eksplisit dalam feed BPJT; situs operator SMR belum berhasil diambil melalui HTTPS yang tervalidasi. Cakupan nasional belum 100%.
