<div align="center">
  <h1>🛒 Rukun Jaya POS — Frontend</h1>
  <p><strong>Enterprise Inventory & Point of Sale Management System</strong></p>

  ![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
  ![React Query](https://img.shields.io/badge/React_Query-5-FF4154?style=for-the-badge&logo=reactquery)
</div>

<br />

Sistem frontend untuk **Kasir Toko Rukun Jaya**, dibangun dengan fokus pada kecepatan performa, UI/UX modern, dan skalabilitas tinggi. Mengadopsi arsitektur Next.js 14 App Router.

---

## 🚀 Fitur Utama

- **Role-based Dashboard**: Tampilan khusus untuk Owner dan Cashier.
- **Real-time Inventory**: Pencarian, penambahan, dan _bulk update_ stok produk secara responsif.
- **Smart Point of Sale (POS)**: Transaksi cepat dengan perhitungan harga grosir/ecer, diskon member, dan PPN otomatis.
- **Financial Analytics**: Grafik laporan keuangan interaktif menggunakan Recharts.
- **Audit Trails**: Laporan perubahan sistem terpusat untuk keamanan operasional.
- **Docker Ready**: Dukungan penuh untuk *containerization* terisolasi.

---

## 🛠️ Cara Instalasi & Menjalankan (Lokal)

### 1. Prasyarat Sistem
- **Node.js** v18+ 
- Backend server yang berjalan secara lokal atau _remote_.

### 2. Konfigurasi Environment
Salin template _environment variable_:
```bash
cp .env.example .env
```
Lalu, sesuaikan isi `.env` Anda jika diperlukan:
```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_NAME="Toko Rukun Jaya"
BASE_URL_API="http://localhost:5000/api/v1/"
```

### 3. Instalasi Dependensi & Run
```bash
npm install
npm run dev
```
Buka browser dan akses: **http://localhost:3000**

---

## 🐳 Menjalankan dengan Docker

Proyek ini telah dikonfigurasi dengan mode **Next.js Standalone** untuk meminimalisir ukuran _image_ pada saat _production_ dan mempercepat *deployment*.

```bash
# Build dan jalankan frontend di background
docker-compose up --build -d
```
Aplikasi akan secara otomatis berjalan dan dapat diakses pada port `3000`.

---

## 📂 Struktur Direktori

```text
src/
├── app/                  # Routing & Halaman (App Router)
│   ├── (auth)/           # Grup halaman otentikasi
│   ├── (owner)/          # Layout dan halaman Dashboard Owner
│   └── (cashier)/        # Layout dan halaman POS Kasir
├── components/           # Komponen UI Reusable
│   ├── layout/           # Sidebar, Navbar
│   ├── providers/        # React Query Provider, dsb.
│   └── ui/               # Button, Badge, Input (Atomic Design)
├── lib/                  # Utilitas Inti
│   ├── api.ts            # Definisi API calls terpusat (Axios Interceptors)
│   ├── auth.ts           # Manajemen state autentikasi & cookies
│   └── mockData.ts       # Fallback mock data untuk development
└── middleware.ts         # Otentikasi global & Role-based Routing Guard
```

---

## 🔧 Troubleshooting Umum

- **`Hydration mismatch`**: Terjadi karena ada komponen yang dirender berbeda di Server vs Client. Tambahkan direktif `"use client"` di baris pertama file jika komponen menggunakan *hooks* dari React (misal: `useState`).
- **Error API / `ECONNREFUSED`**: Pastikan layanan _backend_ Anda sudah berjalan, dan URL pada variabel `BASE_URL_API` (di file `.env`) merujuk ke _port_ yang benar (default `5000`).
- **Redirect Loop ke `/login`**: Sistem mendeteksi ketiadaan *cookie* otentikasi. Silakan lakukan proses *login* terlebih dahulu.

---

<div align="center">
  <p>Dibuat untuk kelancaran operasional <b>Toko Rukun Jaya</b>.</p>
</div>
