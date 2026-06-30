# Dokumentasi API yang Belum Tersedia (Missing Backend APIs)

Dokumen ini memuat spesifikasi teknis (HTTP Method, Endpoint, Query Parameters, dan Struktur Response) untuk API yang belum tersedia pada backend saat ini namun dibutuhkan oleh modul-modul frontend.

---

## 1. Get Storage Zones
Digunakan pada halaman **Warehouse Stock & Allocation** (`/warehouse`) untuk memantau kapasitas penyimpanan gudang, status utilisasi zona, dan detail penempatan rak.

* **HTTP Method**: `GET`
* **Endpoint**: `/api/v1/warehouse/storage-zones`
* **Headers**: `Authorization: Bearer <token>`
* **Query Parameters**:
  * `gudang_id` (optional, string) - ID gudang spesifik
* **Response Contoh (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Storage zones retrieved successfully",
    "data": [
      {
        "name": "Zone A - Heavy Goods",
        "capacity": 85,
        "status": "High Utilization",
        "total_items": 1240,
        "racks": ["Rack A1", "Rack A2", "Floor Stack 1"]
      },
      {
        "name": "Zone B - Retail items",
        "capacity": 42,
        "status": "Normal",
        "total_items": 320,
        "racks": ["Rack B1", "Rack B2", "Rack B3"]
      },
      {
        "name": "Zone C - Hazard & Chemical",
        "capacity": 15,
        "status": "Underutilized",
        "total_items": 45,
        "racks": ["Rack C1", "Cabinet C1"]
      },
      {
        "name": "Zone D - Yard (Bulk Goods)",
        "capacity": 65,
        "status": "Normal",
        "total_items": 540,
        "racks": ["Yard Area 1", "Yard Area 2"]
      }
    ]
  }
  ```

---

## 2. Get Suppliers List & Performance
Digunakan pada halaman **Supplier Management** (`/supplier`) untuk menampilkan list vendor terdaftar, detail kontak, volume spend pengadaan, status, dan rating.

* **HTTP Method**: `GET`
* **Endpoint**: `/api/v1/suppliers`
* **Headers**: `Authorization: Bearer <token>`
* **Query Parameters**:
  * `search` (optional, string) - Cari berdasarkan nama vendor
  * `category` (optional, string) - Filter berdasarkan kategori material (e.g. Semen, Besi, Cat)
* **Response Contoh (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Suppliers list retrieved successfully",
    "data": [
      {
        "id": "SUP-001",
        "supplier_id": "VND-SEMEN-IND",
        "vendor_name": "Semen Indonesia",
        "category": "Cement",
        "primary_contact": "Budi Rahardjo",
        "phone": "+62 811-2345-6789",
        "status": "Active",
        "rating": 4.8
      },
      {
        "id": "SUP-002",
        "supplier_id": "VND-KRAKATAU-ST",
        "vendor_name": "Krakatau Steel",
        "category": "Steel",
        "primary_contact": "Hendra Wijaya",
        "phone": "+62 812-9876-5432",
        "status": "Active",
        "rating": 4.5
      },
      {
        "id": "SUP-003",
        "supplier_id": "VND-JATI-TIMBER",
        "vendor_name": "Jati Indah Timber",
        "category": "Timber",
        "primary_contact": "Suryo Utomo",
        "phone": "+62 813-1111-2222",
        "status": "Active",
        "rating": 4.2
      },
      {
        "id": "SUP-004",
        "supplier_id": "VND-AVIAN-PAINTS",
        "vendor_name": "Avian Brands",
        "category": "Paint",
        "primary_contact": "Santi Lestari",
        "phone": "+62 815-5555-6666",
        "status": "Inactive",
        "rating": 3.9
      }
    ]
  }
  ```

---

## 3. Get All Transactions (Transaction History)
Digunakan pada halaman **Transaction History** (`/transaction-history`) untuk menampilkan riwayat penjualan lengkap, filter multi-kasir, dan visualisasi bar chart perolehan omzet.

* **HTTP Method**: `GET`
* **Endpoint**: `/api/v1/transactions`
* **Headers**: `Authorization: Bearer <token>`
* **Query Parameters**:
  * `payment_method` (optional, string) - Cash, Transfer, Credit
  * `status` (optional, string) - Success, Pending, Cancelled
  * `cashier_id` (optional, string) - ID/Kode kasir yang melayani
  * `date_from` (optional, string) - Rentang awal tanggal transaksi (format YYYY-MM-DD)
  * `date_to` (optional, string) - Rentang akhir tanggal transaksi (format YYYY-MM-DD)
* **Response Contoh (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Transactions history retrieved successfully",
    "data": [
      {
        "id": "TRX-99824",
        "created_at": "2026-06-23T14:32:00.000Z",
        "customer_name": "PT. Maju Jaya",
        "customer_type": "VIP",
        "cashier_code": "CSH-01",
        "payment_method": "Transfer",
        "total_amount": 12500000,
        "status": "Success"
      },
      {
        "id": "TRX-99823",
        "created_at": "2026-06-23T13:15:00.000Z",
        "customer_name": "Budi Santoso",
        "customer_type": "RETAIL",
        "cashier_code": "CSH-02",
        "payment_method": "Credit",
        "total_amount": 4200000,
        "status": "Pending"
      },
      {
        "id": "TRX-99820",
        "created_at": "2026-06-23T11:45:00.000Z",
        "customer_name": "Toko Anugrah",
        "customer_type": "",
        "cashier_code": "CSH-01",
        "payment_method": "Cash",
        "total_amount": 850000,
        "status": "Cancelled"
      }
    ]
  }
  ```
