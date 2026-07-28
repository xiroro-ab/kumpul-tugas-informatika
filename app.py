import os
from flask import Flask, render_template, request, redirect, flash
from werkzeug.utils import secure_filename

# Membuat instance aplikasi web menggunakan Flask
app = Flask(__name__)

# Mengatur secret key yang dibutuhkan untuk menampilkan pesan error (flash message)
app.secret_key = 'kunci_rahasia_untuk_flash_message'

# Menentukan lokasi folder untuk menyimpan file tugas yang diupload
# Folder ini berada di server dan tidak diekspos langsung ke URL publik
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Menentukan batas maksimal ukuran file yang boleh diupload (10 MB)
# 10 * 1024 * 1024 byte = 10 Megabyte
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

# Menentukan ekstensi file yang diizinkan, dalam hal ini hanya 'pdf'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'}

# Membuat folder uploads jika folder tersebut belum ada di server
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Fungsi untuk memeriksa apakah ekstensi file sesuai dengan yang diizinkan
def allowed_file(filename):
    # Memeriksa apakah ada titik di nama file dan ekstensinya ada di ALLOWED_EXTENSIONS
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Mengatur rute utama ('/') yang bisa menerima metode GET (tampil form) dan POST (kirim form)
@app.route('/', methods=['GET', 'POST'])
def upload_file():
    # Jika pengguna mengirim form (metode POST)
    if request.method == 'POST':
        # Mengambil data 'nama' dari input form
        nama = request.form.get('nama')
        # Mengambil data 'kelas' dari input form
        kelas = request.form.get('kelas')
        
        # Memeriksa apakah file ada dalam request yang dikirim
        if 'file' not in request.files:
            # Jika tidak ada, tampilkan pesan error
            flash('Tidak ada file yang diunggah.')
            # Kembalikan pengguna ke halaman form
            return redirect(request.url)
            
        # Mengambil file dari request
        file = request.files['file']
        
        # Jika pengguna tidak memilih file (nama file kosong)
        if file.filename == '':
            # Tampilkan pesan error
            flash('Tidak ada file yang dipilih.')
            # Kembalikan pengguna ke halaman form
            return redirect(request.url)
            
        # Jika file ada dan formatnya sesuai dengan yang diizinkan
        if file and allowed_file(file.filename):
            # Mengamankan nama file untuk mencegah serangan path traversal (direktori traversal)
            filename = secure_filename(file.filename)
            
            # Membuat nama file baru yang lebih unik dan terstruktur: Nama_NamaFileAsli
            # Ini berguna agar file tidak tertukar dan rapi
            safe_nama = secure_filename(nama) if nama else 'TanpaNama'
            safe_kelas = secure_filename(kelas) if kelas else 'TanpaKelas'
            
            # Membuat folder khusus untuk kelas tersebut
            class_folder = os.path.join(app.config['UPLOAD_FOLDER'], safe_kelas)
            if not os.path.exists(class_folder):
                os.makedirs(class_folder)
                
            new_filename = f"{safe_nama}_{filename}"
            
            # Menentukan path atau lokasi lengkap penyimpanan file
            save_path = os.path.join(class_folder, new_filename)
            
            # Menyimpan file ke lokasi yang sudah ditentukan di server
            file.save(save_path)
            
            # Mengembalikan teks sukses (tanpa memberikan akses list direktori)
            return "Tugas Berhasil Terkirim"
        else:
            # Jika file bukan tipe yang diizinkan, tampilkan pesan error
            flash('Format file tidak didukung. Hanya diperbolehkan PDF, DOC, DOCX, JPG, PNG.')
            # Kembalikan pengguna ke halaman form
            return redirect(request.url)
            
    # Jika metode GET (pengguna baru membuka web), tampilkan file template HTML
    return render_template('upload.html')

# Menangani error jika pengguna mengupload file lebih dari batas maksimal (10MB)
@app.errorhandler(413)
def request_entity_too_large(error):
    # Mengembalikan pesan error sederhana jika file terlalu besar
    return 'File terlalu besar. Maksimal ukuran file adalah 10MB.', 413

# Memastikan aplikasi dijalankan hanya jika file ini dieksekusi langsung
if __name__ == '__main__':
    # Menjalankan aplikasi Flask dengan mode debug aktif
    app.run(debug=True, port=3000, host='0.0.0.0')
