# loopa — Playful Everyday Fashion Marketplace

> **Tagline:** *Style Goes Around.*  
> Platform marketplace C2C fashion modern berbasis PWA yang memfasilitasi transaksi busana harian kurasi Gen-Z & Milenial (18–35 tahun) melalui eksplorasi editorial, chat interaktif real-time, dan ulasan bukti media (OOTD visual proof) tanpa rating bintang bot/palsu.

---

## 🎨 Brand Identity & Design System

### 1. Visual Direction: Playful Modern + Contemporary Fashion Editorial
- **Brand Logo:** Bold lowercase wordmark `loopa` dengan aksen dot pill Electric Lime.
- **Aesthetic:** Editorial fashion photography, asymmetric product grids, tactile rounded components (`rounded-3xl` / `rounded-4xl`), playful graphic stickers & pills, serta bayangan tegas berkarakter (`shadow-playful: 4px 4px 0px 0px #242424`).
- **Typography:**
  - Headings: `Plus Jakarta Sans` (Bold, ExtraBold, Black)
  - Body: `Inter` (Medium, SemiBold)
- **Palette Warna Resmi:**
  - ⚡ **Electric Lime:** `#D9F36A` (Energetic accent & status aktif)
  - 💜 **Soft Lavender:** `#A99AF7` (Playful tags & category badges)
  - 🧡 **Coral Orange:** `#FF876F` (Highlight alerts & shopping callouts)
  - 🌾 **Warm Cream:** `#F7F3EC` (Primary canvas background)
  - 🖤 **Deep Charcoal:** `#242424` (Text contrast, borders & structural lines)

---

## 🌟 Implementasi Halaman Sesuai Spesifikasi

### A. Homepage (`/`)
- **Editorial Fashion Hero:** Headline berani *"Style Goes Around."*, CTA eksplorasi & chat, serta kartu showcase editorial dinamis dengan rotasi playful.
- **Trending Wardrobe Categories:** Kartu kategori visual (Vintage Archive, Knit & Crochet, Streetwear & Denim, Footwear & Tabi, Y2K Accessories).
- **Featured Independent Stylists:** Profil kurator terverifikasi (@studiorasa, @knitbyzoe, @archiveclub) dengan indikator online real-time.
- **Trending Now:** Asymmetric fashion product grid dengan badge condition (*Vintage*, *Handmade*, *Like New*).
- **Fresh Finds:** Rilisan pakaian dan aksesoris terbaru.
- **Community OOTD Style Reviews:** Galeri bukti foto/video styling asli dari pembeli terverifikasi (tanpa rating bintang).

### B. Explore (`/explore`)
- Grid eksplorasi busana lengkap dengan filter multi-dimensi:
  - Pencarian teks (nama pakaian, material, atau nama penjual).
  - Filter kategori dan filter kondisi pakaian (*Vintage / Thrift*, *Handmade Rework*, *Brand New*, *Like New*).
  - Pilihan sorting (Newest Drops, Termurah, Tertinggi).
  - Paginasi berbasis kursor (*Load More Pieces*).

### C. Product Detail (`/products/[id]`)
- Galeri foto editorial berukuran besar dengan thumbnail interaktif.
- Informasi produk, detail bahan, fitting notes, harga dalam Rupiah, dan status stok.
- **Variant Size Selector:** Pilihan ukuran (S, M, L, XL, atau One Size).
- Kartu penjual independen lengkap dengan status kehadiran real-time (*Active Now*).
- **Chat Penjual Dulu:** Membuka percakapan dengan kartu produk dan ukuran terpilih yang terlampir otomatis.
- **Beli Langsung:** Mengarahkan ke checkout 3 langkah dengan data varian yang terisi otomatis.
- Bagian ulasan media OOTD komunitas dan formulir upload ulasan foto styling.

### D. Chat-First Commerce (`/chat`)
- Percakapan real-time pembeli & penjual.
- Lampiran kartu produk otomatis (*auto-attached product card*) di dalam thread obrolan.
- Tombol aksi *"Buat Order Pre-filled"* langsung dari dalam bubble percakapan.
- Pembatasan hak akses: Tamu (Guest) diarahkan untuk login terlebih dahulu sesuai PRD Section 8 Matrix.

### E. Checkout 3 Langkah (`/checkout`)
- **Langkah 1:** Kontak Pembeli (Nama, Email, WhatsApp).
- **Langkah 2:** Alamat Pengiriman Lengkap & Catatan Kurir.
- **Langkah 3:** Rekening Transfer Manual Penjual (BCA / Mandiri) & Upload Bukti Bayar.
- Ringkasan pesanan lengkap dengan ukuran yang dipilih dan foto pakaian.
- Penguncian stok atomik (`SELECT FOR UPDATE`) untuk mencegah *overselling* saat berebut pakaian limited.

### F. Seller Studio & Dashboard (`/dashboard`)
- Ringkasan omzet penjualan (GMV), pesanan masuk, dan tingkat konversi.
- Modal inspeksi bukti transfer: Penjual dapat melihat foto struk dan melakukan **Setujui (Approve)** atau **Tolak (Reject)** dengan alasan.
- Manajemen katalog pakaian: Tambah item baru dengan detail ukuran (*sizes*), kondisi, dan varian warna.
- Tombol simulasi **Auto-Cancel 24 Jam** untuk membatalkan order kadaluwarsa dan mengembalikan stok.

### G. Pengalaman Mobile PWA (`manifest.json` & Bottom Nav)
- *Sticky bottom navigation bar* responsif (Discover, Explore, Chat dengan notifikasi, Orders, Studio/Profile).
- Target sentuhan minimal 44px, layout single-column yang nyaman dioperasikan satu tangan, dan loading cepat < 2 detik.

---

## 🛡️ Matriks Hak Akses Pengguna

| Fitur | Guest | Member | Seller (Stylist) |
| :--- | :---: | :---: | :---: |
| Jelajahi Feed & Cari Pakaian | ✅ Ya | ✅ Ya | ✅ Ya |
| Partisipasi dalam Real-Time Chat | ❌ Tidak (Prompt Login) | ✅ Ya | ✅ Ya |
| Checkout 3 Langkah | ✅ Ya (Guest Checkout) | ✅ Ya (Tersimpan) | ✅ Ya |
| Unggah Bukti Transfer | ✅ Ya | ✅ Ya | ✅ Ya |
| Verifikasi / Tolak Pembayaran | ❌ Tidak | ❌ Tidak | ✅ Ya (Seller Studio) |
| Manajemen Pakaian & Stok | ❌ Tidak | ❌ Tidak | ✅ Ya |

> *Ganti role kapan saja melalui tombol **Role Simulator** di navbar atas (Guest Mode, Member Mode, atau Seller Mode).*

---

## 🚀 Menjalankan Proyek

```bash
# Jalankan server pengembangan
npm run dev

# Build produksi (telah diverifikasi sukses)
npm run build
npm run start
```
Buka browser di **`http://localhost:3000`**.
