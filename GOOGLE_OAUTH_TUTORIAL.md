# Tutorial Lengkap Menghubungkan Google Auth (beserta Google Drive) ke Supabase

Pesan error `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}` terjadi karena Anda belum sepenuhnya mengaktifkan dan mengonfigurasi provider Google di dashboard Supabase.

Berikut adalah panduan langkah demi langkah dari awal untuk mendapatkan Client ID dan Secret, serta mengatur URL Redirect-nya.

## Langkah 1: Dapatkan URL Callback dari Supabase
1. Masuk ke dashboard [Supabase](https://app.supabase.com).
2. Pilih proyek Anda.
3. Di menu sebelah kiri, klik ikon **Authentication** (gambar gembok).
4. Buka menu **Providers** (di bawah menu *Configuration*).
5. Cari dan klik **Google**.
6. Anda akan melihat sebuah URL di bagian **Callback URL (for OAuth)**. URL ini biasanya terlihat seperti ini: `https://abcdefghijklmnopq.supabase.co/auth/v1/callback`.
7. **Salin (Copy) URL tersebut**. Anda akan membutuhkannya di Google Cloud. Biarkan halaman Supabase ini tetap terbuka.

## Langkah 2: Buat Project di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Login menggunakan akun Google Anda.
3. Di kiri atas (sebelah logo Google Cloud), klik dropdown **Select a project** (atau nama proyek jika Anda sudah punya).
4. Klik **New Project** di pojok kanan atas jendela pop-up.
5. Beri nama proyek (misal: "Aplikasi Pengumpulan Tugas"), lalu klik **Create**. Tunggu beberapa saat sampai proyek selesai dibuat, lalu pastikan proyek tersebut sudah dipilih.

## Langkah 3: Konfigurasi OAuth Consent Screen
*Ini adalah layar persetujuan yang dilihat pengguna saat mereka login menggunakan Google.*

1. Di menu navigasi kiri Google Cloud, buka **APIs & Services** > **OAuth consent screen**.
2. Pilih **External** (agar pengguna selain Anda bisa login), lalu klik **Create**.
3. Isi informasi aplikasi:
   - **App name**: (Misal: "Admin Pengumpul Tugas")
   - **User support email**: Pilih email Anda.
   - **Developer contact information**: Masukkan email Anda lagi.
   - Biarkan yang lain kosong.
4. Klik **Save and Continue**.
5. Pada bagian **Scopes**, klik **Add or Remove Scopes**.
   - Karena aplikasi ini perlu membuat folder dan mengunggah file ke Google Drive admin, Anda **WAJIB** menambahkan scope Drive.
   - Di kolom filter, cari `drive.file`. 
   - Centang kotak untuk scope `https://www.googleapis.com/auth/drive.file` (Keterangan: *See, edit, create, and delete only the specific Google Drive files you use with this app*).
   - Klik **Update**, lalu klik **Save and Continue**.
6. Pada bagian **Test users**, Anda bisa menambahkan alamat email Anda sendiri sebagai *Test user*. (Saat aplikasi berstatus "Testing", hanya email yang didaftarkan di sini yang bisa login). Klik **Save and Continue**.
7. Klik **Back to Dashboard**.

## Langkah 4: Buat Credentials (Client ID & Secret)
1. Di menu navigasi kiri, klik **Credentials**.
2. Di bagian atas, klik **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. Di dropdown *Application type*, pilih **Web application**.
4. Beri nama (misal: "Supabase Login").
5. Gulir ke bawah ke bagian **Authorized redirect URIs**.
6. Klik **+ ADD URI**.
7. **Paste (Tempel)** URL Callback yang Anda salin dari Supabase di Langkah 1 tadi (contoh: `https://abcdefghijklmnopq.supabase.co/auth/v1/callback`).
8. *(Opsional)* Jika Anda ingin mencoba login di localhost, tambahkan juga URI `http://localhost:3000` atau URL Vercel Anda nanti di bagian **Authorized JavaScript origins**.
9. Klik **CREATE**.
10. Akan muncul *pop-up* yang menampilkan **Client ID** dan **Client Secret**. Jangan tutup *pop-up* ini dulu (atau copy dan simpan di notepad).

## Langkah 5: Masukkan Credentials ke Supabase
1. Kembali ke halaman Supabase (di bagian **Authentication > Providers > Google**).
2. Aktifkan sakelar (toggle) **Enable Google** di kanan atas kotak Google.
3. Paste **Client ID** dari Google ke kolom *Client ID* di Supabase.
4. Paste **Client Secret** dari Google ke kolom *Client Secret* di Supabase.
5. Klik **Save**.

## Langkah 6: Selesai!
Sekarang coba buka halaman `admin.html` (atau klik tombol login) lagi. Sistem login menggunakan akun Google seharusnya sudah berfungsi tanpa error `provider is not enabled`, dan akan meminta izin untuk mengakses Google Drive Anda.
