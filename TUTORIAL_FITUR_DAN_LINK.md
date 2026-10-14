# Panduan Fitur Baru: Pengumpulan Link & Otomasi Google Drive

Aplikasi **Pengumpulan Tugas Informatika SMP Negeri 58 Palembang** kini telah dilengkapi dengan fitur pengumpulan tautan (link) dan fitur kenyamanan siswa.

---

## 🌟 Fitur Baru yang Telah Ditambahkan

1. **Dual-Mode Pengumpulan (File vs Link)**:
   - **📁 Unggah File**: Mengumpulkan berkas fisik (PDF, Word, JPG, PNG).
   - **🔗 Kirim Tautan / Link**: Mengumpulkan tugas berbasis link/web (Instagram Video Reels/Post, TikTok, Canva, Google Docs/Slides/Sheets, Scratch, CapCut, YouTube, GitHub, dsb.).
2. **Deteksi Platform & Peringatan Hak Akses**:
   - Sistem secara otomatis mengenali link **Instagram**, **TikTok**, **Canva**, **Google Docs**, **Scratch**, **CapCut**, atau **YouTube**.
   - Untuk **Instagram & TikTok**: Memberikan pengingat khusus bahwa akun siswa **TIDAK BOLEH di-private (harus akun publik)** agar video bisa diputar dan dinilai oleh guru.
   - Untuk **Canva & Google Docs**: Memberikan pengingat agar hak akses link diatur ke *"Siapa saja yang memiliki tautan dapat melihat"*.
3. **Auto-Remember Data Diri (Local Storage)**:
   - Nama lengkap dan kelas siswa tersimpan otomatis di perangkat (HP/Laptop) mereka.
   - Pada pertemuan berikutnya, siswa tidak perlu mengetik ulang dari awal.
4. **Bukti Resi Pengumpulan Digital (Digital Receipt)**:
   - Setelah tugas terkirim, sistem menampilkan kartu tanda terima resmi berisi:
     - Nomor Resi (ID Bukti)
     - Tanggal & Waktu Pengumpulan (Realtime WIB)
     - Nama Siswa & Kelas
     - Nama Tugas & Metode (File / Link)
     - Rincian link atau daftar file
   - Dilengkapi tombol cetak / simpan dan imbauan tangkap layar (*screenshot*).
5. **Konversi Link ke File Shortcut di Google Drive**:
   - Saat admin menekan tombol **"SINKRONISASI SEKARANG"**, sistem otomatis membuat file pintasan web berformat `.html` di Google Drive dalam folder:
     `Tugas Siswa > [Kelas] > [Nama Tugas] > [Nama Siswa] > Tautan_[Nama].html`
   - Guru cukup mengklik file tersebut di Google Drive, dan halaman tugas siswa (Canva/Docs) akan langsung terbuka.
6. **Penyempurnaan Panel Admin**:
   - Menampilkan label pembeda yang jelas (`[LINK]` warna ungu vs `[FILE]` warna biru).
   - Tombol **"Buka Link ↗"** agar guru bisa langsung memeriksa tugas siswa tanpa harus sinkronisasi ke Drive terlebih dahulu.
   - Ekspor laporan CSV yang kini mencakup tipe pengumpulan dan URL lengkap.

---

## 🛠️ Langkah Update Database Supabase (Opsional / Direkomendasikan)

Kode web sudah dirancang tahan error (*backward-compatible*), namun untuk menjaga kerapian struktur tabel di Supabase, Anda sangat disarankan menjalankan perintah SQL berikut:

1. Buka dashboard [Supabase](https://app.supabase.com) dan pilih proyek Anda.
2. Di menu sebelah kiri, klik **SQL Editor**.
3. Klik **+ New Query**, lalu tempel (paste) kode berikut:

```sql
-- Tambahkan kolom 'tipe' dan 'link_url' ke tabel files
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS tipe text DEFAULT 'file',
ADD COLUMN IF NOT EXISTS link_url text;

-- Pastikan kolom storage_path bisa fleksibel
ALTER TABLE public.files 
ALTER COLUMN storage_path DROP NOT NULL;
```

4. Klik tombol **Run** (hijau) di pojok kanan bawah. Selesai!

---

## 📱 Panduan untuk Siswa

1. Buka website pengumpulan tugas.
2. Masukkan **Nama Lengkap**, pilih **Kelas**, dan pilih **Materi / Nama Tugas**.
3. Di bagian **Metode Pengumpulan**, klik tombol **"Tautan / Link"**.
4. Tempel (*paste*) alamat URL tugas (contoh: link Canva atau Google Docs).
5. **Perhatikan Catatan Penting**:
   - **Canva**: Klik *Bagikan* > ubah tautan kolaborasi menjadi *"Siapa saja yang memiliki tautan dapat melihat"*.
   - **Google Docs/Slides**: Ubah akses dari *"Dibatasi"* menjadi *"Siapa saja yang memiliki link"*.
   - **Scratch**: Pastikan proyek sudah di-klik *"Bagikan / Share"*.
6. Klik tombol **"Kirim Tugas"**.
7. Simpan atau *screenshot* **Bukti Resi Pengumpulan** yang muncul di layar.

---

## 👨‍🏫 Panduan untuk Guru (Admin Panel)

1. Buka halaman `/admin` (atau klik tombol **Buka Panel Admin Guru** di pojok kanan atas).
2. Login menggunakan akun Google Anda yang memiliki akses Google Drive.
3. Di tabel **Tugas Belum Disinkronisasi**:
   - Anda bisa langsung mengklik **"Buka Link ↗"** untuk melihat tugas Canva/Docs siswa saat itu juga.
   - Anda bisa menyaring tugas berdasarkan Kelas, Materi, atau mencari nama siswa.
   - Anda bisa mengunduh rekap dalam bentuk file Excel/CSV dengan menekan tombol **"CSV"**.
4. **Memindahkan ke Google Drive**:
   - Klik tombol **"SINKRONISASI SEKARANG"**.
   - Sistem akan mengunggah file tugas dan membuat file pintasan `.html` untuk setiap tautan link siswa langsung ke folder Google Drive Anda sesuai struktur kelas dan materi.
