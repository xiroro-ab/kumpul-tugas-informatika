# Panduan LMS SMP Negeri 58 Palembang (Untuk 30 Guru & Siswa)

Sistem telah dirombak menjadi **LMS Penuh (Learning Management System)** yang mendukung hingga **30 Guru Mata Pelajaran** dan seluruh siswa SMPN 58 Palembang, tanpa menggunakan Google Drive lagi. Semua data dan berkas tersimpan langsung di **Supabase**.

---

## 1. Langkah Pertama: Update Database di Supabase (Wajib)

1. Buka [Dashboard Supabase](https://supabase.com/dashboard) dan pilih project Anda.
2. Di menu sebelah kiri, klik **SQL Editor**.
3. Klik tombol **New query** (+).
4. Buka file [`supabase_lms_schema.sql`](./supabase_lms_schema.sql) di project ini, **salin (copy) seluruh isinya**, lalu **tempel (paste)** ke dalam SQL Editor Supabase.
5. Klik tombol hijau **Run** di pojok kanan bawah.
   *(Skrip ini aman, idempotent, dan tidak akan menghapus data tugas yang sudah terkumpul sebelumnya).*

---

## 2. Cara Mengubah Nama Project di Supabase (Opsional & Aman)

Jika Anda ingin mengubah nama project di Supabase agar tidak tertulis `kumpul-tugas-informatika`:
1. Masuk ke menu **Project Settings** (ikon gerigi ⚙️ di kiri bawah).
2. Pilih tab **General**.
3. Pada kolom **Project Name**, ganti menjadi: `LMS-SMPN-58` atau nama lain yang Anda sukai.
4. Klik **Save changes**. 
   *(URL dan API Key Anda tidak akan berubah, website tetap normal 100%).*

---

## 3. Cara Mendapatkan Kunci Google Gemini AI (Gratis)

Fitur Generator Soal, Pembuat Materi, dan Koreksi Otomatis ditenagai oleh Google Gemini Flash:
1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Login dengan akun Google Anda.
3. Klik tombol **Get API key** di pojok kiri atas -> lalu klik **Create API key**.
4. Salin kode kunci API tersebut.
5. Di website Anda, masuk ke **Panel Guru** (`/admin.html`) -> buka tab **⚙️ AI & Opsi** -> tempelkan kunci di kolom **Google Gemini API Key** -> klik **SIMPAN KUNCI AI**.
   *(Bisa juga dimasukkan ke Vercel Environment Variable dengan nama `VITE_GEMINI_API_KEY`).*

---

## 4. Cara 30 Guru Menggunakan LMS

Setiap guru di SMPN 58 dapat mengakses sistem dengan alur berikut:

### A. Login & Atur Profil Mapel
* Guru membuka halaman `/admin.html` lalu klik **Masuk dengan Akun Google**.
* Guru klik tombol **⚙️ Ubah Profil & Mapel** untuk memasukkan Nama Lengkap & Mata Pelajaran (contoh: *Bpk. Budi Santoso, S.Pd. - IPA*).
* Setiap guru hanya fokus mengelola mata pelajarannya sendiri.

### B. Meja Koreksi Tugas Siswa
* Masuk ke tab **📋 Koreksi Tugas**.
* Guru dapat melihat kiriman file dan tautan dari siswa per kelas.
* Klik tombol **Koreksi**:
  * Muncul jendela preview berkas atau tautan tugas siswa.
  * Klik tombol **"✨ Koreksi AI"**: Gemini AI akan membaca isi tugas siswa dan memberikan saran nilai (0-100) serta kalimat masukan yang mendidik.
  * Guru bisa menyesuaikan nilai lalu klik **Simpan Nilai**.
* Guru bisa mengunduh rekap nilai seluruh kelas ke Excel melalui tombol **Unduh Rekap Nilai CSV**.

### C. Pembuat Materi Belajar dengan AI
* Masuk ke tab **📖 Materi Ajar**.
* Klik tombol **✨ AI Buatkan Materi** -> ketik topik yang diinginkan (contoh: *"Struktur Lapisan Bumi dan Gunung Berapi"*).
* Gemini AI akan menyusun ringkasan lengkap untuk siswa SMP dalam 3 detik. Guru tinggal klik simpan!

### D. Bank Soal & Ujian Online dengan AI
* Masuk ke tab **📝 Bank Soal Ujian**.
* Klik tombol **✨ AI Generator Soal** -> ketik judul ujian, topik materi, jumlah pilihan ganda, dan jumlah esai.
* Gemini AI langsung menyusun butir soal, opsi A/B/C/D, kunci jawaban, dan rubrik esai otomatis.
* Ujian langsung aktif dan siap dikerjakan siswa.

---

## 5. Cara Siswa Menggunakan LMS

Siswa cukup membuka halaman utama website:
1. **📥 Kumpul Tugas:** Siswa memilih Kelas, Mata Pelajaran, Judul Tugas, lalu mengunggah berkas atau tautan. Langsung mendapatkan Bukti Resi Pengumpulan Digital.
2. **📖 Materi Belajar:** Siswa bisa membaca rangkuman materi dan menonton video belajar per mata pelajaran.
3. **📝 Ujian Online:** Siswa memilih kuis aktif, menjawab soal pilihan ganda & esai dengan timer waktu, lalu sistem langsung menghitung skor pilihan ganda secara instan.
4. **🎯 Cek Nilai:** Siswa cukup mengetik namanya untuk melihat riwayat nilai dan catatan evaluasi dari guru/AI.
