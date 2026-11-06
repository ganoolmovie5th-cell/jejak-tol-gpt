# Sumber operator

Kontrak diamati pada 3 November 2026; tidak ada jaminan API publik stabil.

- Astra: https://www.astratol.co.id/
  - MMS POST `/api/struk`, multipart `keyword`, `periodeAwal`, `periodeAkhir`.
  - MHI GET `https://api-struk.margaharjaya.co.id/api/v1/etoll/search/{card}/{start}/{end}`.
  - LMS GET `https://lms.astratol.co.id:2001/api/v1/etoll/search/{card}/{start}/{end}`.
  - Format tanggal YYYY-MM-DD. Respons `.data` array.
- Serbaraja: https://serbaraja.sinarmasland.com/
  - GET `/api/receipt?cardNumber=...&dateFrom=...&dateTo=...`, respons array.

Tidak memakai endpoint email. Payload operator dinormalisasi; nomor kartu yang berbeda dan tanggal di luar periode tidak ditampilkan. Respons tidak meneruskan metadata infrastruktur operator.

## Aset dan cetak
Logo grayscale MMS/MHI/LMS serta watermark berasal dari aset publik Astra: `/logo_header-grayscale.png`, `/mhi-grayscale.png`, `/lms-grayscale.png`, `/watermark-astra-infra.png`. Logo Serbaraja berasal dari aset publik situs Serbaraja. Digunakan untuk mengidentifikasi sumber transaksi, bukan menyatakan afiliasi.

Astra mengubah halaman cetak menjadi gambar dengan html2canvas dan jsPDF; Serbaraja membuka template cetak browser. Tidak ditemukan URL PDF asli yang tetap. Implementasi ini merekonstruksi tata letak, mengelompokkan per ruas/operator, dan menambahkan asal pembuatan JejakTol. Perbedaan tipografi, paginasi, dan revisi situs dapat menghasilkan perbedaan visual.

## Penyelarasan contoh PDF

Template diperiksa terhadap PDF resmi yang diberikan pengguna pada 3 November 2026. Astra memakai urutan timestamp mentah, termasuk akhiran zona waktu, 9 struk per halaman, header hanya pada halaman pertama, watermark ukuran asli, dan teks overload beserta gerbang tujuan sesuai kondisi situs. Font fallback Arial mengikuti hasil contoh, dengan ukuran 12px/20px pada detail. Serbaraja mempertahankan detik, golongan Romawi, tabel bertitik dua, dan format kartu berkelompok. Tidak menyalin tanggal cetak lama, header/footer browser, atau mengklaim file dicetak langsung oleh situs operator. Kesamaan biner/piksel lintas browser tidak dijamin.

## Operator tambahan (3 November 2026)

- JTD: GET `https://bc01.jtd.co.id/api/jlp/beranda/struk`, query tglAwal, tglAkhir, noKartu. Array data; field waktu, nama_gerbang, gardu, saldo, tarif, resi, link_api. Link unduhan dibatasi origin bc01.jtd.co.id.
- BSD: GET `https://www.bsdtol.com/struk` dengan header X-Requested-With XMLHttpRequest dan query kartu, tanggal_awal, tanggal_akhir, start, length (DataTables).
- Makassar: GET `https://tolmakassar.com/struk`, header AJAX, query kartu, tanggal_awal (00:00:00), tanggal_akhir (23:59:59), page. Halaman berikut diminta sampai kosong atau penanda akhir.
- Citra: frontend https://struk.citrapersada.net memakai POST https://struk.citrapersada.co.id/getStruk, JSON no_card (kelompok 4 digit dipisahkan tanda hubung), tgl_awal, tgl_akhir (ISO). Array query. Endpoint mengalami timeout dari jaringan pengujian, bukan bukti nihil transaksi.
- JLB: GET lalu POST https://strukdigital.jlbjorrw1.com/struk, token _token dan cookie sesi baru, field card_number, start_date, end_date. Parser konservatif untuk struk dengan checkboxs[]; bentuk tidak dikenal dilaporkan partial dan pengguna diarahkan ke situs resmi, tidak disisipkan HTML operator. Uji nyata menghasilkan halaman tanpa struk; parser transaksi berisi diuji dengan fixture sintetis saja.
- CTP Tollways: https://www.ctptollways.co.id/cetak-struk tetap Segera.

Tidak menambah counter cetak atau mengirim email ke operator. Hasil uji kosong tidak membuktikan seluruh bentuk data produksi sudah tervalidasi. PDF operator tambahan diberi label Rekap transaksi, bukan salinan resmi.

## Tampilan hasil, 6 November 2026
Serbaraja: waktu, gerbang masuk, gerbang keluar, golongan, bank, tarif, saldo, nomor resi.
JTD: resi, gerbang, gardu, saldo, tarif, waktu. BSD: waktu, gardu, golongan, tarif, saldo (kolom kartu/resi tersembunyi di situs sumber tidak ditampilkan).
Astra, Makassar, Citra menampilkan kartu detail; data relevan dipertahankan dalam urutan bacanya, lalu dapat ditampilkan sebagai tabel JejakTol. JLB halaman publik hanya menunjukkan placeholder tanpa transaksi; urutan detail JLB belum dapat diverifikasi dengan contoh berisi. Semua tabel ditambah checkbox dan tindakan JejakTol.
