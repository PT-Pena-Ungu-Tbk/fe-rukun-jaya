# Menggunakan Node.js versi 20 (Alpine Linux yang super ringan)
FROM node:20-alpine

# Menentukan direktori kerja di dalam container
WORKDIR /app

# Menyalin file daftar package terlebih dahulu (untuk caching layer)
COPY package.json package-lock.json* ./

# Menginstal semua dependensi dengan bersih
RUN npm ci

# Menyalin seluruh source code frontend Anda ke dalam container
COPY . .

# Membangun aplikasi Next.js untuk production
RUN npm run build

# Mengekspos port 3000 agar bisa diakses dari luar
EXPOSE 3000

# Perintah utama untuk menjalankan aplikasi saat container menyala
CMD ["npm", "run", "start"]
