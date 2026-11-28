# Lapar.in

Aplikasi web review warung kantin kampus. Mahasiswa bisa melihat daftar warung, menu, dan rating. Pemilik warung dan admin bisa mengelola data warung sesuai hak akses masing-masing.

Tugas 5 mata kuliah Rekayasa Sistem Informasi.

## Fitur

- Daftar warung dengan pencarian, filter kategori, dan pagination
- Detail warung berdasarkan ID, lengkap dengan menu dan rating
- Tambah, ubah, dan hapus data warung sesuai role pengguna
- Registrasi, login, dan informasi pengguna yang sedang login
- Pembatasan akses berdasarkan role: Admin, Owner, dan Customer
- Penanganan respons 401 Unauthorized dan 403 Forbidden
- Tampilan loading, empty, dan error state

## Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Axios, Lucide React |
| Backend | Node.js, Express 5, TypeScript, Drizzle ORM, JWT (jsonwebtoken), bcryptjs, Zod |
| Database | Microsoft SQL Server |
| Dokumentasi API | Swagger (swagger-autogen dan swagger-ui-express) |

## Struktur folder

```
tugas5-rsi/
├── backend/        API (routes, controllers, services, repositories) dan skrip database (db/)
├── frontend/       Antarmuka pengguna (React)
├── .gitignore
└── README.md
```

## Prasyarat

- Node.js 22.18.0 atau lebih baru, dan npm
- Microsoft SQL Server yang sudah berjalan, dengan koneksi TCP/IP aktif di port 1433
- `sqlcmd` untuk menjalankan skrip database

## Cara menjalankan

### 1. Clone repositori

```bash
git clone https://github.com/ayuanisaistiqomah-rgb/tugas5-rsi.git
cd tugas5-rsi
```

### 2. Siapkan database

Sebelum menjalankan skrip, buka `backend/db/01-create-database-and-user.sql` dan ganti `GANTI_DENGAN_PASSWORD_SENDIRI` dengan password milikmu. Password yang sama nanti dipakai di `backend/.env`.

Lalu jalankan dari folder `backend`:

```powershell
cd backend
sqlcmd -S localhost -E -C -i db\00-setup-mixed-mode.sql
sqlcmd -S localhost -E -C -i db\01-create-database-and-user.sql
sqlcmd -S localhost -E -C -i db\02-schema.sql
sqlcmd -S localhost -E -C -i db\03-seed.sql
sqlcmd -S localhost -E -C -i db\04-seed-baru.sql
sqlcmd -S localhost -E -C -i db\05-seed-password-hashes.sql
sqlcmd -S localhost -E -C -i db\06-audit-log-append-only.sql
```

Skrip `00` cukup dijalankan sekali. Skrip `01` membuat database `review_kantin` beserta akun SQL Server untuk aplikasi, `02` membuat tabel, `03` dan `04` mengisi data awal, dan `05` mengisi password akun uji coba. Skrip `06` melengkapi tabel `AUDIT_LOGS` dengan informasi IP address, user agent, dan hasil aktivitas. Skrip ini juga menerapkan aturan append-only melalui trigger dan pembatasan hak akses, sehingga akun aplikasi hanya dapat membaca dan menambahkan data audit, tetapi tidak dapat mengubah atau menghapus riwayat audit. Skrip `06` dijalankan setelah skrip `01` sampai `05`, karena database, tabel, dan akun aplikasi harus sudah tersedia.

### 3. Backend

```powershell
npm install
Copy-Item .env.example .env
```

(Di macOS atau Linux: `cp .env.example .env`)

Buka `backend/.env`, lalu isi variabel berikut. **File `.env` tidak diunggah ke GitHub.**

| Variabel | Keterangan |
|---|---|
| `CORS_ORIGIN` | Alamat frontend yang diizinkan mengakses backend, default `http://localhost:5173` |
| `DB_SERVER` | Alamat server SQL Server, default `localhost` |
| `DB_PORT` | Port SQL Server, default `1433` |
| `DB_USER` | Username akun SQL Server untuk aplikasi |
| `DB_PASSWORD` | Password akun SQL Server untuk aplikasi |
| `DB_NAME` | Nama database yang digunakan, default `review_kantin` |
| `DB_ENCRYPT` | Pengaturan enkripsi koneksi SQL Server, default `false` |
| `DB_TRUST_SERVER_CERTIFICATE` | Pengaturan kepercayaan terhadap sertifikat server SQL Server, default `true` |
| `JWT_SECRET` | Secret key yang digunakan untuk membuat dan memverifikasi token JWT |
| `JWT_EXPIRES_IN` | Masa berlaku token JWT, default `2h` |
| `BCRYPT_SALT_ROUNDS` | Jumlah salt rounds untuk proses hashing password, default `10` |

Sesuaikan nilai variabel dengan konfigurasi komputer masing-masing. Isi `DB_USER`, `DB_PASSWORD`, dan `JWT_SECRET` sebelum menjalankan backend. Gunakan nilai `DB_USER` dan `DB_PASSWORD` sesuai akun SQL Server yang dibuat pada skrip database.

### Menjalankan Backend

Pastikan terminal berada di folder `backend`, kemudian jalankan:

```powershell
npm run dev

Buka terminal baru, lalu masuk ke folder frontend dari folder utama proyek:
cd frontend
npm install
npm run dev



**Jadi, urutan menjalankan aplikasi nanti:**

1. Pastikan SQL Server sudah berjalan.
2. Jalankan backend dengan `npm run dev` dari folder `backend`.
3. Buka terminal baru, jalankan frontend dengan `npm run dev` dari folder `frontend`.
4. Buka `http://localhost:5173` di browser.

**Catatan:** Backend dan frontend harus tetap berjalan di dua terminal yang berbeda agar aplikasi bisa digunakan.