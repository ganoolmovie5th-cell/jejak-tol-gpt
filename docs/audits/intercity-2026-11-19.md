# Audit kalkulator tol — 19 November 2026

Audit ini memeriksa katalog dan enam perjalanan antarkota pada API produksi. Hasil “total tersedia” berarti kalkulator dapat menghitung seluruh komponen yang dikenali, bukan verifikasi transaksi aktual atau bukti cakupan nasional lengkap. Rute TomTom memakai lalu lintas saat pencarian; tarif/rute uji bukan nilai yang harus dipaksakan untuk pencarian berikutnya.

## Katalog

- 88 nama ruas tarif BPJT; 28 sistem pembayaran kalkulator, dengan 55 nama ruas BPJT belum terdaftar. Angka ruas dan sistem tidak dapat dibandingkan sebagai persentase karena satu sistem dapat menggabungkan beberapa ruas.
- Semua 28 sistem memiliki baris tarif.
- Dari 17 sistem tertutup, ada 15 pasangan arah balik yang tidak tersedia eksplisit di feed: Tangerang–Merak 2, Jakarta–Cikampek 4, Kanci–Pejagan 3, Pasuruan–Probolinggo 6. Ini gap bukti data, bukan dasar menyalin tarif arah sebaliknya.
- Tidak ditemukan pasangan duplikat/tarif Golongan I tidak valid pada pasangan sistem tertutup yang diaudit.
- Koreksi alat audit: 22 titik operator yang digunakan kalkulator sebelumnya tidak ikut dihitung. Sekarang titik dipisah per sumber. Titik dari dua sumber bisa menunjuk gerbang yang sama; jumlah titik bukan jumlah gerbang unik.

Rincian: [katalog dan pasangan](toll-coverage-2026-11-19.json).

## Rute dua arah

Lokasi dipilih dari hasil pencarian API, bukan langsung menerima hasil pertama: hasil pertama “Tunjungan Plaza Surabaya” beralamat Darmo Permai, sehingga digunakan POI Chipmunks Tunjungan Plaza 5 di Basuki Rahmat. Koordinat dan seluruh respons tersimpan di [bukti pengujian](intercity-2026-11-19.json).

| Asal–tujuan | Hasil aplikasi | Temuan |
| --- | --- | --- |
| Gambir–CSB Cirebon | Parsial Rp20.000 | Wiyoto Wiyono, Cibitung–Cilincing belum terdaftar; batas masuk Cipali tidak dikenali |
| CSB Cirebon–Gambir | Parsial Rp3.000 | Batas keluar Cipali tidak dikenali; Wiyoto Wiyono belum terdaftar |
| CSB Cirebon–Paragon Semarang | Total Rp307.500 | Seluruh komponen terhitung |
| Paragon Semarang–CSB Cirebon | Parsial Rp276.000 | Pasangan Pejagan–Kanci tidak tersedia di feed |
| Paragon Semarang–Tunjungan Plaza 5 | Total Rp462.000 | Seluruh komponen terhitung |
| Tunjungan Plaza 5–Paragon Semarang | Total Rp468.000 | Termasuk tambahan Surabaya–Gempol Rp6.000; jalur berbeda dari arah pergi |

Tiga dari enam sampel menghasilkan total. Ini hasil sampel, bukan persentase cakupan nasional atau ukuran akurasi tarif.

## Urutan perbaikan berikutnya

1. **Pemetaan rute Jakarta–Cirebon:** respons tidak mencantumkan Jakarta–Cikampek di antara akses barat dan Cipali. Periksa geometri/guidance mentah, identifikasi ruas yang terlewat, dan perbaiki pengenalannya sebelum menambahkan sambungan. Jangan menyambungkan Cibitung–Cilincing atau Wiyoto langsung ke Cipali hanya untuk menghasilkan total.
2. **Cibitung–Cilincing:** butuh matriks tarif berarah dan batas antarseksi. Operator menerbitkan tarif diskon sejak 1 Juli 2026 di https://www.ctptollways.co.id/tarif ; bandingkan dengan BPJT sebelum mengaktifkan perhitungan. Jangan menerapkan tarif datar dari satu baris.
3. **Wiyoto Wiyono/CTC:** verifikasi aturan pembayaran terintegrasi agar alias ruas tidak menyebabkan pembayaran ganda.
4. **Pejagan–Kanci:** peroleh tabel operator/keputusan tarif yang menyebut arah balik. Feed BPJT saat audit hanya mencantumkan Kanci–Pejagan, Kanci–Ciledug, dan Ciledug–Pejagan.
5. **Regresi:** ulang hanya rute yang terdampak perubahan berikutnya; pertahankan kasus jalan lokal, masuk tol ulang, pasangan tarif hilang dan sumber gagal.

Kasus Merak–Karawaci tetap terpisah, menunggu bukti pembayaran aktual. Audit ini tidak mengubah aturan tarif produksi atau memaksa total untuk rute parsial.

Validasi perubahan alat audit: 93 tes lulus; build berhasil.
