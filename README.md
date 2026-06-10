# Rukun Jaya POS — Frontend

**Next.js 14 | TypeScript | Tailwind CSS | React Query**

Sistem Kasir Toko Rukun Jaya — Enterprise Inventory & POS Management System.

---

## Struktur File & Folder

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (Provider, Toaster)
│   ├── page.tsx                    # Redirect → /login
│   ├── globals.css                 # Tailwind + custom styles
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   └── login/page.tsx          # Halaman login (Owner & Cashier)
│   ├── (owner)/                    # Protected: role OWNER
│   │   ├── layout.tsx              # Sidebar owner
│   │   ├── dashboard/page.tsx      # Dashboard utama + inventory table
│   │   ├── inventory/page.tsx      # CRUD produk
│   │   ├── warehouse/page.tsx      # Storage zones & stock movements
│   │   ├── supplier/page.tsx       # Manajemen supplier
│   │   ├── stock-alerts/page.tsx   # Low stock & bulk update
│   │   ├── financial-reports/page.tsx  # Laporan keuangan + chart
│   │   └── user-management/page.tsx    # Manajemen staff
│   └── (cashier)/                  # Protected: role CASHIER
│       ├── layout.tsx              # Sidebar kasir
│       ├── pos/page.tsx            # POS transaksi utama
│       ├── product-search/page.tsx # Pencarian produk
│       ├── check-stock/page.tsx    # Cek stok
│       └── transaction-history/page.tsx  # Riwayat transaksi + audit
├── components/
│   ├── layout/
│   │   ├── OwnerSidebar.tsx        # Sidebar untuk owner
│   │   ├── CashierSidebar.tsx      # Sidebar untuk kasir
│   │   └── TopNav.tsx              # Header bar dengan search
│   ├── providers/
│   │   └── QueryProvider.tsx       # React Query provider
│   └── ui/
│       ├── Button.tsx              # Button reusable
│       ├── Input.tsx               # Input dengan icon
│       ├── Badge.tsx               # Status badge
│       └── StockBadge.tsx          # Badge In Stock/Low/Out
├── lib/
│   ├── api.ts                      # Semua API call (sesuai kontrak)
│   ├── axios.ts                    # Axios instance + interceptor JWT
│   ├── auth.ts                     # Helper save/get/clear token (cookies)
│   ├── utils.ts                    # formatRupiah, formatDate, cn(), dll.
│   └── mockData.ts                 # Data mock untuk development
├── types/
│   └── index.ts                    # Semua TypeScript types
└── middleware.ts                   # Auth guard (redirect ke /login)
```

---

## Cara Instalasi & Menjalankan

### 1. Prasyarat
- **Node.js** v18+ ([download](https://nodejs.org))
- **npm** v9+ (sudah termasuk dalam Node.js)
- Backend Express.js berjalan di `http://localhost:5000`

### 2. Install Dependencies

```bash
cd "rukun jaya"
npm install
```

Jika muncul error peer dependency:
```bash
npm install --legacy-peer-deps
```

### 3. Konfigurasi Environment

Edit file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME=Toko Rukun Jaya
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka browser: **http://localhost:3000**

### 5. Build untuk Production

```bash
npm run build
npm run start
```

---

## Login Demo (Tanpa Backend)

Klik **"Login as Owner"** atau **"Login as Cashier"** di halaman login.
Sistem akan otomatis masuk dengan mock user (tidak butuh backend aktif).

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@toko-rukunjaya.com | password_rahasia |
| Cashier | cashier@toko-rukunjaya.com | password_rahasia |

---

## Koneksi ke Backend

Semua API call ada di `src/lib/api.ts`. Base URL diambil dari `.env.local`.

| Endpoint | Method | File |
|----------|--------|------|
| `/auth/login` | POST | `authApi.login()` |
| `/products` | GET | `inventoryApi.getProducts()` |
| `/products` | POST | `inventoryApi.createProduct()` |
| `/products/bulk-update` | PUT | `inventoryApi.bulkUpdateStock()` |
| `/members/verify` | GET | `membersApi.verifyMember()` |
| `/transactions/checkout` | POST | `transactionsApi.checkout()` |
| `/transactions/return` | POST | `transactionsApi.returnProduct()` |
| `/reports/financial` | GET | `reportsApi.getFinancial()` |
| `/audit-logs` | GET | `auditApi.getLogs()` |

---

## Debugging

### ❌ Error: `Module not found` atau `Cannot find module`

```bash
# Hapus node_modules dan reinstall
rm -rf node_modules .next
npm install
```

### ❌ Error: `ECONNREFUSED` atau API 404

1. Pastikan backend berjalan di port 5000
2. Cek `.env.local` → `NEXT_PUBLIC_API_URL` sudah benar
3. Lihat di browser DevTools → Network tab untuk melihat request yang gagal

### ❌ Error: Halaman redirect loop ke `/login`

Middleware di `src/middleware.ts` butuh cookie `token`. Untuk skip middleware sementara:
```bash
# Rename file middleware
mv src/middleware.ts src/middleware.ts.bak
```

### ❌ Error: `Hydration mismatch` (client/server not matching)

Tambahkan `"use client"` di atas komponen yang menggunakan `useState`, `useEffect`, atau hooks browser.

### ❌ Error: Recharts tidak render

Pastikan komponen chart dibungkus `"use client"` dan data tidak kosong:
```tsx
"use client";
// ... recharts imports
```

### ❌ Error: `Cannot read properties of undefined`

Data dari API mungkin belum siap. Gunakan fallback:
```ts
const products = data?.data ?? mockProducts;
```

### Cara Melihat Error di Console

1. Buka browser → F12 → tab **Console**
2. Untuk error API: F12 → tab **Network** → filter XHR/Fetch
3. Untuk error Next.js: lihat terminal tempat `npm run dev` berjalan

### Mengganti ke Data Real (Bukan Mock)

Di setiap page, ubah pola ini:
```ts
// Sebelum (fallback ke mock):
const products = data?.data ?? mockProducts;

// Sesudah (hanya data real):
const products = data?.data ?? [];
```

---

## Tech Stack

| Library | Versi | Kegunaan |
|---------|-------|----------|
| Next.js | 14.2.x | Framework React (App Router) |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.x | Styling |
| @tanstack/react-query | 5.x | Data fetching & caching |
| axios | 1.7.x | HTTP client |
| js-cookie | 3.x | Simpan JWT di cookie |
| recharts | 2.x | Chart/grafik |
| react-hot-toast | 2.x | Notifikasi toast |
| lucide-react | 0.383.x | Icon library |
