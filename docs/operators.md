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

Astra mengubah halaman cetak menjadi gambar dengan html2canvas dan jsPDF; Serbaraja membuka template cetak browser. Tidak ditemukan URL PDF asli yang tetap. Implementasi ini merekonstruksi tata letak, mengelompokkan per ruas/operator, dan menambahkan asal pembuatan SakuKartu. Perbedaan tipografi, paginasi, dan revisi situs dapat menghasilkan perbedaan visual.
