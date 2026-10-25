export interface Meeting {
  id: string;
  number: number;
  title: string;
  description: string;
  objective: string;
  duration: string;
  summary: string;
  keywords: string[];
}

export interface Chapter {
  id: string;
  title: string;
  code: string; // e.g., 'BK', 'AD', 'AP', etc.
  description: string;
  iconName: string; // Name of Lucide icon to display
  meetings: Meeting[];
}

export interface GradeCurriculum {
  grade: number;
  title: string;
  description: string;
  chapters: Chapter[];
}

export const curriculumData: GradeCurriculum[] = [
  {
    grade: 7,
    title: "Kelas 7 - Fondasi Informatika",
    description: "Membangun fondasi berpikir logis dan pemahaman dasar tentang perangkat komputasi serta data.",
    chapters: [

      {
        id: "tik",
        title: "Teknologi Informasi dan Komunikasi",
        code: "TIK",
        description: "Memahami antarmuka pengguna, pengelolaan file, peramban web, aplikasi perkantoran, serta komunikasi surel.",
        iconName: "MonitorSmartphone",
        meetings: [
          {
            id: "tik_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Teknologi Informasi dan Komunikasi lengkap dengan video pembelajaran.",
            objective: "Siswa mampu memahami konsep dasar TIK mulai dari antarmuka hingga komunikasi elektronik.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "Konsep", "TIK"]
          },
          {
            id: "tik_meeting1",
            number: 1,
            title: "Antarmuka & Pengelolaan File",
            description: "Memahami antarmuka pengguna (UI) dan cara mengelola file serta folder.",
            objective: "Siswa mampu berinteraksi dengan antarmuka dan menyortir file sesuai dengan tipenya.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Praktek manajemen file dengan memilah file gambar, dokumen, dan musik dengan cepat.",
            keywords: ["UI", "File", "Folder", "Drag and Drop"]
          },
          {
            id: "tik_meeting2",
            number: 2,
            title: "Peramban & Aplikasi Perkantoran",
            description: "Memanfaatkan peramban untuk mencari informasi dan menggunakan aplikasi perkantoran.",
            objective: "Siswa mampu melakukan pencarian cerdas di peramban dan memahami aplikasi perkantoran.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Latih kemampuan mencari informasi akurat dengan menggunakan kata kunci yang spesifik.",
            keywords: ["Browser", "Pencarian", "Kata Kunci", "Perkantoran"]
          },
          {
            id: "tik_meeting3",
            number: 3,
            title: "Komunikasi Surel",
            description: "Mempelajari cara memanfaatkan aplikasi surel (email) untuk berkomunikasi.",
            objective: "Siswa mampu menyusun komponen-komponen surel dengan benar dan sopan.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Praktek menyusun elemen-elemen email seperti subjek, penerima, lampiran, dan isi pesan.",
            keywords: ["Email", "Surel", "Komunikasi", "Internet"]
          },
          {
            id: "tik_evaluasi_game",
            number: 4,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan misi pertanyaan seputar TIK dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal TIK.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "TIK"]
          },
          {
            id: "tik_evaluasi_akhir",
            number: 5,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori TIK.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab TIK.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang perangkat TIK dan penggunaannya.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "bk",
        title: "Berpikir Komputasional",
        code: "BK",
        description: "Metode menyelesaikan persoalan dengan menerapkan teknik ilmu komputer (informatika) untuk memecahkan masalah dalam kehidupan sehari-hari.",
        iconName: "Brain",
        meetings: [
          {
            id: "meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Berpikir Komputasional lengkap dengan presentasi interaktif dan video pembelajaran.",
            objective: "Siswa mampu memahami konsep dasar dan implementasi 4 pilar Berpikir Komputasional.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Presentasi", "Video", "Konsep"]
          },
          {
            id: "meeting1",
            number: 1,
            title: "Pilar 1: Dekomposisi",
            description: "Memecah masalah besar menjadi bagian-bagian kecil yang lebih mudah dikelola.",
            objective: "Siswa mampu menerapkan teknik dekomposisi untuk mengurutkan langkah secara terstruktur.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Praktek langsung dekomposisi melalui permainan mengurutkan aktivitas.",
            keywords: ["Dekomposisi", "Sub-masalah", "Kompleksitas", "Drag and Drop"]
          },
          {
            id: "meeting2",
            number: 2,
            title: "Pilar 2: Pengenalan Pola",
            description: "Mencari kemiripan atau tren dalam suatu data untuk membuat prediksi.",
            objective: "Siswa mampu mengidentifikasi pola atau tren untuk memprediksi kelanjutan suatu rangkaian.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Latih ketelitianmu dalam mengenali kemiripan antar elemen dalam sebuah pola berulang.",
            keywords: ["Pola", "Tren", "Kemiripan", "Prediksi"]
          },
          {
            id: "meeting3",
            number: 3,
            title: "Pilar 3: Abstraksi",
            description: "Menyaring informasi penting dan mengabaikan detail yang tidak relevan.",
            objective: "Siswa mampu fokus pada detail utama yang dibutuhkan untuk menyelesaikan masalah.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Fokus pada apa yang penting, abaikan yang tidak perlu.",
            keywords: ["Abstraksi", "Fokus", "Informasi Penting"]
          },
          {
            id: "meeting4",
            number: 4,
            title: "Pilar 4: Algoritma",
            description: "Menyusun instruksi atau langkah-langkah yang logis dan berurutan.",
            objective: "Siswa mampu menyusun urutan perintah logis dan terurut untuk memecahkan masalah spasial.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Algoritma membutuhkan urutan instruksi yang tepat sasaran agar program tidak menabrak hambatan.",
            keywords: ["Algoritma", "Labirin", "Instruksi Logis", "Problem Solving"]
          },
          {
            id: "evaluasi_game",
            number: 5,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan 10 misi (pertanyaan) interaktif dengan timer dan combo. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal Berpikir Komputasional dengan sistem gamifikasi.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi di Leaderboard.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "Game"]
          },
          {
            id: "evaluasi_akhir",
            number: 6,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab Berpikir Komputasional.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang 4 pilar Berpikir Komputasional.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "sk",
        title: "Sistem Komputer",
        code: "SK",
        description: "Mempelajari komponen perangkat keras (hardware), perangkat lunak (software), dan bagaimana mereka berinteraksi.",
        iconName: "Cpu",
        meetings: [
          {
            id: "sk_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Sistem Komputer lengkap dengan video pembelajaran.",
            objective: "Siswa mampu memahami konsep dasar Sistem Komputer mulai dari jenis, komponen, cara kerja, hingga bilangan biner.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "Konsep", "SK"]
          },
          {
            id: "sk_meeting1",
            number: 1,
            title: "Jenis dan Fungsi Komputer",
            description: "Memahami berbagai jenis komputer dan fungsinya dalam kehidupan sehari-hari.",
            objective: "Siswa dapat membedakan jenis-jenis komputer (mikrokomputer, PC, server, dll) dan fungsinya.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Setiap jenis komputer memiliki fungsi dan spesifikasi yang berbeda sesuai dengan kebutuhannya.",
            keywords: ["Jenis Komputer", "Fungsi", "Microcomputer", "Server"]
          },
          {
            id: "sk_meeting2",
            number: 2,
            title: "Komponen Sistem Komputer",
            description: "Mengenal perangkat keras (hardware), perangkat lunak (software), dan pengguna (brainware).",
            objective: "Siswa dapat mengidentifikasi komponen utama sistem komputer.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Sistem komputer tidak akan berjalan tanpa adanya kesatuan dari Hardware, Software, dan Brainware.",
            keywords: ["Hardware", "Software", "Brainware", "Komponen"]
          },
          {
            id: "sk_meeting3",
            number: 3,
            title: "Cara Kerja Komputer",
            description: "Memahami siklus input, proses, memori, dan output.",
            objective: "Siswa mampu mengurutkan dan menjelaskan siklus pemrosesan data pada komputer.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Komputer bekerja melalui tahapan menerima masukan, memprosesnya, menyimpannya, dan menghasilkan keluaran.",
            keywords: ["Input", "Proses", "Output", "Siklus"]
          },
          {
            id: "sk_meeting4",
            number: 4,
            title: "Bilangan Biner & Konversi",
            description: "Mempelajari sistem bilangan biner yang digunakan komputer dan cara konversinya.",
            objective: "Siswa mampu mengonversi bilangan desimal ke biner dan sebaliknya.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Komputer hanya mengerti bahasa mesin yang terdiri dari angka 0 dan 1 (bilangan biner).",
            keywords: ["Biner", "Desimal", "Konversi", "Bahasa Mesin"]
          },
          {
            id: "sk_evaluasi_game",
            number: 5,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan pertanyaan seputar Sistem Komputer dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal Sistem Komputer.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "SK"]
          },
          {
            id: "sk_evaluasi_akhir",
            number: 6,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori Sistem Komputer.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab Sistem Komputer.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang Sistem Komputer.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "jki",
        title: "Jaringan Komputer dan Internet",
        code: "JKI",
        description: "Mempelajari konsep jaringan internet, macam-macam jaringan komputer, perangkat jaringan, dan praktik enkripsi sederhana.",
        iconName: "Network",
        meetings: [
          {
            id: "jki_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Jaringan Komputer dan Internet lengkap dengan video pembelajaran.",
            objective: "Siswa mampu memahami konsep dasar jaringan, konektivitas, hingga keamanan data (enkripsi).",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "Konsep", "JKI"]
          },{
            id: "jki_meeting1",
            number: 1,
            title: "Macam-macam Jaringan Internet",
            description: "Menjelaskan berbagai teknologi untuk terhubung ke internet.",
            objective: "Siswa mampu memahami perbedaan teknologi jaringan internet seperti Fiber Optik, Wi-Fi, dan Seluler.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Internet dapat diakses melalui berbagai jenis koneksi.",
            keywords: ["Internet", "Wi-Fi", "Fiber Optik", "Satelit"]
          },
          {
            id: "jki_meeting2",
            number: 2,
            title: "Macam-macam Jaringan Komputer",
            description: "Mempelajari pengelompokan jaringan berdasarkan skala (LAN, MAN, WAN, PAN).",
            objective: "Siswa dapat membedakan skala cakupan jaringan komputer.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Setiap jaringan komputer memiliki jangkauan wilayah yang berbeda-beda.",
            keywords: ["LAN", "MAN", "WAN", "PAN"]
          },
          {
            id: "jki_meeting3",
            number: 3,
            title: "Menghubungkan Perangkat ke Internet",
            description: "Praktik cara menghubungkan ponsel dan komputer ke jaringan dengan kabel atau nirkabel.",
            objective: "Siswa dapat menyambungkan perangkat ke internet melalui koneksi yang tersedia.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Tethering dan hotspot sangat berguna saat butuh internet tanpa Wi-Fi.",
            keywords: ["Tethering", "Hotspot", "Kabel", "Nirkabel"]
          },
          {
            id: "jki_meeting4",
            number: 4,
            title: "Praktik Enkripsi Sederhana",
            description: "Memahami konsep keamanan data dengan menyandikan pesan.",
            objective: "Siswa mampu melindungi data dan informasi menggunakan teknik enkripsi sederhana.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Enkripsi menjaga privasi pesan kita di dunia digital.",
            keywords: ["Enkripsi", "Keamanan", "Privasi", "Sandi"]
          },
          {
            id: "jki_evaluasi_game",
            number: 5,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan pertanyaan seputar JKI dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal Jaringan Komputer & Internet.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "JKI"]
          },
          {
            id: "jki_evaluasi_akhir",
            number: 6,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori Jaringan Komputer & Internet.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab JKI.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang Jaringan Komputer dan Internet.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "ad",
        title: "Analisis Data",
        code: "AD",
        description: "Mempelajari konsep data, cara mengelola, mengolah, dan menganalisis data serta menginterpretasikannya.",
        iconName: "BarChart3",
        meetings: [
          {
            id: "ad_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Analisis Data lengkap dengan video pembelajaran.",
            objective: "Siswa mampu memahami konsep dasar data, pengolahan, hingga visualisasi.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "Konsep", "AD"]
          },
          {
            id: "ad_meeting1",
            number: 1,
            title: "Mengenal Data",
            description: "Memahami apa itu data, jenis data, dan cara pengumpulannya.",
            objective: "Siswa mampu memahami konsep data dan membedakan jenis data.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Data adalah fakta mentah yang dapat diolah menjadi informasi berharga.",
            keywords: ["Data", "Kuantitatif", "Kualitatif"]
          },
          {
            id: "ad_meeting2",
            number: 2,
            title: "Mengelola dan Mengolah Data",
            description: "Mengakses, mengelola, mengolah, dan menganalisis data secara efisien.",
            objective: "Siswa dapat mengurutkan, menyaring, dan menggunakan fungsi dasar untuk mengolah data.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Perkakas pengolah lembar kerja membantu kita menganalisis data secara sistematis.",
            keywords: ["Spreadsheet", "Sort", "Filter", "Formula"]
          },
          {
            id: "ad_meeting3",
            number: 3,
            title: "Menginterpretasi dan Memprediksi",
            description: "Menginterpretasi data dan memprediksi situasi konkret sehari-hari.",
            objective: "Siswa dapat membaca grafik dan menarik kesimpulan atau prediksi dari data.",
            duration: "2 JP (2 x 40 Menit)",
            summary: "Visualisasi data membuat kita lebih mudah memahami tren dan membuat keputusan.",
            keywords: ["Interpretasi", "Prediksi", "Grafik", "Visualisasi"]
          },
          {
            id: "ad_evaluasi_game",
            number: 4,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan pertanyaan seputar AD dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal Analisis Data.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "AD"]
          },
          {
            id: "ad_evaluasi_akhir",
            number: 5,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori Analisis Data.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab AD.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang Analisis Data.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "ap",
        title: "Algoritma dan Pemrograman",
        code: "AP",
        description: "Mempelajari konsep dasar algoritma dan menerapkannya dalam pemrograman visual (Scratch).",
        iconName: "Code",
        meetings: [
          {
            id: "ap_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Algoritma dan Pemrograman lengkap dengan presentasi dan video pembelajaran.",
            objective: "Siswa mampu memahami konsep dasar algoritma, serta pengenalan pemrograman visual.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "Slide", "AP"]
          },
          {
            id: "ap_meeting1",
            number: 1,
            title: "Konsep Algoritma & Pemrograman",
            description: "Memahami apa itu algoritma dan bagaimana program komputer bekerja secara logis.",
            objective: "Siswa dapat memahami konsep dasar algoritma secara logis dan terstruktur.",
            duration: "2 JP",
            summary: "Intisari materi dan praktik menyusun algoritma robot dalam game interaktif.",
            keywords: ["Teori", "Video", "Konsep", "AP"]
          },
          {
            id: "ap_meeting2",
            number: 2,
            title: "Pengenalan Pemrograman Visual",
            description: "Mengenali objek dan blok instruksi dasar pada Scratch.",
            objective: "Siswa dapat mengenali objek-objek dan instruksi dalam lingkungan pemrograman visual.",
            duration: "2 JP",
            summary: "Intisari materi dan praktik menjodohkan blok instruksi Scratch pada game interaktif.",
            keywords: ["Scratch", "Game", "Visual", "Blok"]
          },
          {
            id: "ap_evaluasi_game",
            number: 3,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan pertanyaan seputar AP dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal Algoritma dan Pemrograman.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "AP"]
          },
          {
            id: "ap_evaluasi_akhir",
            number: 4,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori Algoritma dan Pemrograman.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab AP.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang Algoritma dan Pemrograman.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "dsi",
        title: "Dampak Sosial Informatika",
        code: "DSI",
        description: "Mempelajari ketersediaan data, informasi di media sosial, keamanan diri, dan etika dunia maya.",
        iconName: "Globe",
        meetings: [
          {
            id: "dsi_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Dampak Sosial Informatika lengkap dengan video pembelajaran.",
            objective: "Siswa mampu memahami dampak media sosial, keterbukaan informasi, dan etika dunia maya.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "Sosial", "Etika"]
          },
          {
            id: "dsi_meeting1",
            number: 1,
            title: "Media Sosial & Informasi Publik",
            description: "Memahami ketersediaan data lewat media sosial serta membedakan informasi publik dan privat.",
            objective: "Siswa mampu memilih informasi yang bersifat publik dan privat.",
            duration: "2 JP",
            summary: "Intisari materi dan praktik mengklasifikasikan informasi publik/privat dalam game interaktif.",
            keywords: ["Publik", "Privat", "Data", "Media Sosial"]
          },
          {
            id: "dsi_meeting2",
            number: 2,
            title: "Keamanan Diri & Etika Digital",
            description: "Menjaga keamanan diri di masyarakat digital serta menerapkan etika dunia maya.",
            objective: "Siswa mampu menjaga keamanan diri dan menerapkan etika saat berselancar di internet.",
            duration: "2 JP",
            summary: "Intisari materi dan praktik simulasi etika berkomunikasi online pada game interaktif.",
            keywords: ["Etika", "Keamanan", "Digital", "Komunikasi"]
          },
          {
            id: "dsi_evaluasi_game",
            number: 3,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan pertanyaan seputar DSI dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal Dampak Sosial Informatika.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "DSI"]
          },
          {
            id: "dsi_evaluasi_akhir",
            number: 4,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori Dampak Sosial Informatika.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab DSI.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang Dampak Sosial Informatika.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      }
    ]
  },
  {
    grade: 8,
    title: "Kelas 8 - Eksplorasi Digital",
    description: "Memperdalam pemahaman tentang jaringan komunikasi, pemrosesan data tingkat menengah, dan algoritma lanjutan.",
    chapters: [
      {
        id: "bk8",
        title: "Berpikir Komputasional",
        code: "BK",
        description: "Menerapkan fungsi, struktur data, dan konsep numerasi (himpunan, sistem bilangan) menggunakan pilar berpikir komputasional.",
        iconName: "Brain",
        meetings: [
          {
            id: "bk8_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Berpikir Komputasional Kelas 8 lengkap dengan video pembelajaran.",
            objective: "Siswa mampu memahami pilar berpikir komputasional, fungsi, struktur data, dan konsep numerasi.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "BK", "Fungsi"]
          },
          {
            id: "bk8_meeting1",
            number: 1,
            title: "Pilar BK, Fungsi & Struktur Data",
            description: "Menjelaskan pilar dalam berpikir komputasional, menerapkan fungsi, dan menerapkan struktur data.",
            objective: "Siswa mampu mengimplementasikan pilar berpikir komputasional, serta memahami struktur data dan fungsi.",
            duration: "2 JP",
            summary: "Intisari materi dan praktik menggunakan struktur data dan fungsi dalam game interaktif.",
            keywords: ["Fungsi", "Struktur Data", "BK"]
          },
          {
            id: "bk8_meeting2",
            number: 2,
            title: "Konsep Numerasi",
            description: "Memahami konsep numerasi yang meliputi himpunan dan sistem bilangan.",
            objective: "Siswa mampu memahami himpunan dan sistem bilangan (biner, oktal, desimal, heksadesimal).",
            duration: "2 JP",
            summary: "Intisari materi dan praktik konversi bilangan dalam game interaktif.",
            keywords: ["Numerasi", "Himpunan", "Sistem Bilangan"]
          },
          {
            id: "bk8_meeting3",
            number: 3,
            title: "Implementasi dalam Numerasi",
            description: "Mengimplementasikan metode dekomposisi, pengenalan pola, abstraksi, dan algoritma dalam masalah numerasi.",
            objective: "Siswa mampu menyelesaikan masalah numerasi menggunakan keempat pilar berpikir komputasional.",
            duration: "2 JP",
            summary: "Intisari materi dan praktik pemecahan masalah numerasi kompleks dalam game interaktif.",
            keywords: ["Implementasi", "Problem Solving", "Numerasi"]
          },
          {
            id: "bk8_evaluasi_game",
            number: 4,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan pertanyaan seputar BK Kelas 8 dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal Berpikir Komputasional Kelas 8.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "BK"]
          },
          {
            id: "bk8_evaluasi_akhir",
            number: 5,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori Berpikir Komputasional Kelas 8.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab BK.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang Berpikir Komputasional Kelas 8.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "tik8",
        title: "Teknologi Informasi & Komunikasi",
        code: "TIK",
        description: "Memahami perangkat lunak aplikasi, fitur-fitur, objek aplikasi, dan laboratorium maya.",
        iconName: "MonitorSmartphone",
        meetings: [
          {
            id: "tik8_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Teknologi Informasi dan Komunikasi Kelas 8 lengkap dengan video pembelajaran.",
            objective: "Siswa mampu memahami objek, fitur aplikasi, dan laboratorium maya.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "Aplikasi", "Laboratorium Maya"]
          },
          {
            id: "tik8_meeting1",
            number: 1,
            title: "Objek dan Fitur Aplikasi",
            description: "Memahami objek pada perangkat lunak aplikasi dan berbagai fiturnya.",
            objective: "Siswa mampu mengidentifikasi objek dan menggunakan fitur perangkat lunak aplikasi dengan tepat.",
            duration: "2 JP",
            summary: "Eksplorasi interaktif tentang objek dan fitur pada perangkat lunak aplikasi.",
            keywords: ["Objek", "Fitur", "Perangkat Lunak"]
          },
          {
            id: "tik8_meeting2",
            number: 2,
            title: "Laboratorium Maya",
            description: "Mengenal dan memanfaatkan laboratorium maya untuk simulasi.",
            objective: "Siswa mampu menggunakan laboratorium maya untuk eksperimen atau simulasi.",
            duration: "2 JP",
            summary: "Praktik menggunakan simulasi laboratorium maya secara interaktif.",
            keywords: ["Laboratorium Maya", "Simulasi"]
          },
          {
            id: "tik8_evaluasi_game",
            number: 3,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan pertanyaan seputar TIK Kelas 8 dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal TIK Kelas 8.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "TIK"]
          },
          {
            id: "tik8_evaluasi_akhir",
            number: 4,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori TIK Kelas 8.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab TIK.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang TIK Kelas 8.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },,
      {
        id: "sk8",
        title: "Sistem Komputer",
        code: "SK",
        description: "Memahami perangkat keras, perangkat lunak, dan peran brainware dengan model 3D interaktif.",
        iconName: "Cpu",
        meetings: [
          {
            id: "sk8_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Sistem Komputer Kelas 8 lengkap dengan video pembelajaran dan presentasi.",
            objective: "Siswa mampu memahami cara kerja sistem komputer, hardware, software, dan brainware.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "Sistem Komputer"]
          },
          {
            id: "sk8_meeting1",
            number: 1,
            title: "Perangkat Keras (Hardware)",
            description: "Mengeksplorasi komponen fisik komputer menggunakan model 3D interaktif.",
            objective: "Siswa mampu mengidentifikasi berbagai macam perangkat keras dan fungsinya.",
            duration: "2 JP",
            summary: "Eksplorasi komponen fisik dalam bentuk 3D interaktif.",
            keywords: ["Hardware", "Input", "Output", "Proses", "3D"]
          },
          {
            id: "sk8_meeting2",
            number: 2,
            title: "Perangkat Lunak (Software)",
            description: "Memahami perbedaan sistem operasi dan perangkat lunak aplikasi.",
            objective: "Siswa mampu mengklasifikasikan perangkat lunak aplikasi dan sistem operasi.",
            duration: "2 JP",
            summary: "Praktik mengklasifikasikan jenis-jenis perangkat lunak komputer.",
            keywords: ["Software", "Sistem Operasi", "Aplikasi"]
          },
          {
            id: "sk8_meeting3",
            number: 3,
            title: "Pengguna Komputer (Brainware)",
            description: "Mengenal berbagai peran manusia dalam mengoperasikan sistem komputer.",
            objective: "Siswa mampu membedakan berbagai profesi dan peran brainware.",
            duration: "2 JP",
            summary: "Praktik menjodohkan deskripsi peran pengguna komputer dengan tepat.",
            keywords: ["Brainware", "Programmer", "Analyst"]
          },
          {
            id: "sk8_evaluasi_game",
            number: 4,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan pertanyaan seputar SK Kelas 8 dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal SK Kelas 8.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "SK"]
          },
          {
            id: "sk8_evaluasi_akhir",
            number: 5,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori SK Kelas 8.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab SK.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang SK Kelas 8.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },,
            {
        id: "jki8",
        title: "Jaringan Komputer & Internet",
        code: "JKI",
        description: "Memahami jaringan komputer, routing, jenis sinyal, dan konektivitas aman.",
        iconName: "Network",
        meetings: [
          {
            id: "jki8_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Jaringan Komputer dan Internet Kelas 8.",
            objective: "Siswa mampu memahami jenis jaringan, konfigurasi, sinyal, dan konektivitas aman.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Video", "Jaringan", "Sinyal", "Internet"]
          },
          {
            id: "jki8_meeting1",
            number: 1,
            title: "Jaringan Komputer dan Internet",
            description: "Memahami jenis jaringan komputer dan konsep routing data.",
            objective: "Siswa mampu mengklasifikasikan jenis jaringan dan menjelaskan konsep routing.",
            duration: "2 JP",
            summary: "Eksplorasi interaktif tentang topologi, jenis jaringan, dan alur pengiriman data.",
            keywords: ["LAN", "WAN", "Routing", "Topologi"]
          },
          {
            id: "jki8_meeting2",
            number: 2,
            title: "Jenis Sinyal",
            description: "Memahami perbedaan sinyal analog dan sinyal digital.",
            objective: "Siswa mampu membedakan sinyal analog dan digital beserta aplikasinya.",
            duration: "2 JP",
            summary: "Praktik simulasi konversi sinyal analog ke digital.",
            keywords: ["Sinyal", "Analog", "Digital", "Transmisi"]
          },
          {
            id: "jki8_meeting3",
            number: 3,
            title: "Komunikasi Data pada Ponsel",
            description: "Memahami cara kerja komunikasi data pada perangkat seluler dan jaringan telekomunikasi.",
            objective: "Siswa mampu menjelaskan bagaimana ponsel berkomunikasi melalui jaringan seluler (BTS).",
            duration: "2 JP",
            summary: "Eksplorasi interaktif tentang sinyal, BTS, dan transmisi data pada ponsel.",
            keywords: ["Ponsel", "Seluler", "BTS", "Komunikasi Data"]
          },
          {
            id: "jki8_evaluasi_game",
            number: 4,
            title: "Game Kuis Evaluasi",
            description: "Selesaikan pertanyaan seputar JKI Kelas 8 dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal JKI Kelas 8.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "JKI"]
          },
          {
            id: "jki8_evaluasi_akhir",
            number: 5,
            title: "Evaluasi Akhir Bab",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori JKI Kelas 8.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab JKI.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang JKI Kelas 8.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "ad8",
        title: "Analisis Data",
        code: "AD",
        description: "Memahami pencarian data, reference, visualisasi data, dan pengelolaan data dengan tabel di MS Excel.",
        iconName: "BarChart3",
        meetings: [
          {
            id: "ad8_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Analisis Data Kelas 8.",
            objective: "Siswa mampu memahami lookup, reference, grafik, dan tabel pada Microsoft Excel.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Excel", "Data", "Grafik"]
          },
          {
            id: "ad8_meeting1",
            number: 1,
            title: "Pencarian Data (Lookup & Reference)",
            description: "Memahami fungsi VLOOKUP, HLOOKUP, dan penggunaan Reference di Excel.",
            objective: "Siswa mampu menggunakan fungsi pencarian data dan reference dengan tepat.",
            duration: "2 JP",
            summary: "Eksplorasi interaktif fungsi VLOOKUP, HLOOKUP, dan Reference dalam mengolah data Excel.",
            keywords: ["VLOOKUP", "HLOOKUP", "Reference", "Excel"]
          },
          {
            id: "ad8_meeting2",
            number: 2,
            title: "Visualisasi Data (Grafik)",
            description: "Membuat visualisasi data dalam bentuk grafik di Excel.",
            objective: "Siswa mampu menyajikan data ke dalam bentuk grafik yang komunikatif.",
            duration: "2 JP",
            summary: "Simulasi interaktif pembuatan grafik dari tabel data.",
            keywords: ["Grafik", "Visualisasi", "Chart", "Excel"]
          },
          {
            id: "ad8_meeting3",
            number: 3,
            title: "Pengelolaan Data dengan Tabel",
            description: "Mengelola data menggunakan fitur Table di Microsoft Excel.",
            objective: "Siswa mampu menggunakan fitur Table untuk mengurutkan dan menyaring data.",
            duration: "2 JP",
            summary: "Eksplorasi interaktif tentang penggunaan fitur Table.",
            keywords: ["Tabel", "Filter", "Sort", "Excel"]
          },
          {
            id: "ad8_evaluasi_game",
            number: 4,
            title: "Game Kuis Evaluasi AD",
            description: "Selesaikan pertanyaan seputar Analisis Data Kelas 8 dengan timer. Skor tertinggimu akan masuk Leaderboard!",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal AD Kelas 8.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "AD"]
          },
          {
            id: "ad8_evaluasi_akhir",
            number: 5,
            title: "Lembar Soal Ujian AD",
            description: "Ujian evaluasi akhir bab secara formal tanpa batasan waktu untuk mengukur pemahaman teori AD Kelas 8.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab Analisis Data.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang AD Kelas 8.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "ap8",
        title: "Algoritma dan Pemrograman",
        code: "AP",
        description: "Memahami konsep logika pemrograman dengan Blockly dan Scratch.",
        iconName: "Code",
        meetings: [
          {
            id: "ap8_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Algoritma dan Pemrograman Kelas 8.",
            objective: "Siswa mampu memahami dasar logika pemrograman visual.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Algoritma", "Pemrograman"]
          },
          {
            id: "ap8_meeting1",
            number: 1,
            title: "Blockly Games",
            description: "Memecahkan masalah algoritma menggunakan game Blockly.",
            objective: "Siswa mampu menyusun logika algoritma dasar menggunakan puzzle Blockly.",
            duration: "2 JP",
            summary: "Praktik menyusun algoritma interaktif dengan Blockly Games.",
            keywords: ["Blockly", "Logika", "Game"]
          },
          {
            id: "ap8_meeting2",
            number: 2,
            title: "Project Games Scratch",
            description: "Membuat project game interaktif menggunakan Scratch.",
            objective: "Siswa mampu membuat game sederhana menggunakan platform pemrograman Scratch.",
            duration: "2 JP",
            summary: "Eksplorasi interaktif pembuatan game dengan blok pemrograman Scratch.",
            keywords: ["Scratch", "Game", "Visual"]
          },
          {
            id: "ap8_evaluasi_game",
            number: 3,
            title: "Game Kuis Evaluasi AP",
            description: "Selesaikan pertanyaan seputar Algoritma dan Pemrograman Kelas 8 dengan timer.",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal AP Kelas 8.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "AP"]
          },
          {
            id: "ap8_evaluasi_akhir",
            number: 4,
            title: "Lembar Soal Ujian AP",
            description: "Ujian evaluasi akhir bab secara formal untuk mengukur pemahaman teori AP Kelas 8.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab Algoritma dan Pemrograman.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang AP Kelas 8.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      },
      {
        id: "dsi8",
        title: "Dampak Sosial Informatika",
        code: "DSI",
        description: "Memahami penggunaan media sosial, mengkaji kritis informasi, dan cyberbullying.",
        iconName: "Globe",
        meetings: [
          {
            id: "dsi8_meeting0",
            number: 0,
            title: "Materi Pokok",
            description: "Landasan teori Dampak Sosial Informatika Kelas 8.",
            objective: "Siswa mampu memahami aspek sosial dari penggunaan informatika dan media sosial.",
            duration: "Self-Paced",
            summary: "Pelajari materi ini sebelum mengerjakan permainan dan kuis di pertemuan berikutnya.",
            keywords: ["Teori", "Media Sosial", "Sosial"]
          },
          {
            id: "dsi8_meeting1",
            number: 1,
            title: "Media Sosial & Dampaknya",
            description: "Memahami pengertian, karakteristik, klasifikasi media sosial, dan dampaknya.",
            objective: "Siswa mampu mengidentifikasi karakteristik media sosial dan dampaknya di kehidupan nyata.",
            duration: "2 JP",
            summary: "Eksplorasi interaktif tentang media sosial dan analisis dampaknya.",
            keywords: ["Media Sosial", "Dampak", "Karakteristik"]
          },
          {
            id: "dsi8_meeting2",
            number: 2,
            title: "Mengkaji Kritis Informasi",
            description: "Mengkaji kritis informasi di media sosial.",
            objective: "Siswa mampu membedakan informasi yang valid (fakta) dengan misinformasi atau hoaks.",
            duration: "2 JP",
            summary: "Praktik menyaring dan mengevaluasi kebenaran informasi di media sosial.",
            keywords: ["Hoaks", "Informasi", "Kritis"]
          },
          {
            id: "dsi8_meeting3",
            number: 3,
            title: "Cyberbullying",
            description: "Memahami bentuk-bentuk cyberbullying dan cara menghindarinya.",
            objective: "Siswa mampu memahami bahaya perundungan siber dan mengambil sikap yang tepat untuk mencegahnya.",
            duration: "2 JP",
            summary: "Simulasi kasus dan penyelesaian konflik terkait cyberbullying.",
            keywords: ["Cyberbullying", "Etika Digital", "Keamanan"]
          },
          {
            id: "dsi8_evaluasi_game",
            number: 4,
            title: "Game Kuis Evaluasi DSI",
            description: "Selesaikan pertanyaan seputar Dampak Sosial Informatika Kelas 8 dengan timer.",
            objective: "Melatih kecepatan dan ketepatan siswa dalam menjawab soal DSI Kelas 8.",
            duration: "1 JP (40 Menit)",
            summary: "Buktikan kemampuanmu. Jawab kuis dengan cepat dan tepat untuk meraih peringkat tertinggi.",
            keywords: ["Gamifikasi", "Kuis", "Leaderboard", "DSI"]
          },
          {
            id: "dsi8_evaluasi_akhir",
            number: 5,
            title: "Lembar Soal Ujian DSI",
            description: "Ujian evaluasi akhir bab secara formal untuk mengukur pemahaman teori DSI Kelas 8.",
            objective: "Mengukur pemahaman akhir siswa secara komprehensif terhadap bab Dampak Sosial Informatika.",
            duration: "1 JP (40 Menit)",
            summary: "Uji pemahamanmu secara menyeluruh tentang DSI Kelas 8.",
            keywords: ["Ujian", "Evaluasi Akhir", "Formal", "Teori"]
          }
        ]
      }
    ]
  },
  {
    grade: 9,
    title: "Kelas 9 - Solusi Teknologi & Kreativitas",
    description: "Menerapkan ilmu informatika untuk membangun produk kreatif, memahami kecerdasan buatan, dan dampaknya bagi sosial.",
    chapters: [
      {
        id: "bk9",
        title: "Berpikir Komputasional",
        code: "BK",
        description: "Menerapkan fungsi, struktur data, algoritma, dan pemrograman visual untuk menyelesaikan berbagai masalah.",
        iconName: "Brain",
        meetings: [
          {
            id: "bk9_meeting1",
            number: 1,
            title: "Materi 1: Struktur Data Tree dan Graph",
            description: "Memahami struktur data tree dan graph serta penggunaannya.",
            objective: "Siswa mampu merepresentasikan dan memproses data menggunakan struktur tree dan graph.",
            duration: "2 JP",
            summary: "Pelajari konsep struktur data tree dan graph melalui video interaktif.",
            keywords: ["Tree", "Graph", "Struktur Data"]
          },
          {
            id: "bk9_meeting1_eval",
            number: 2,
            title: "Evaluasi Game: Struktur Data",
            description: "Game kuis interaktif untuk menguji pemahaman materi Struktur Data Tree dan Graph.",
            objective: "Siswa mampu menjawab kuis terkait tree dan graph secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Tree dan Graph melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Struktur Data"]
          },
          {
            id: "bk9_meeting1_ujian",
            number: 3,
            title: "Ujian Akhir: Struktur Data",
            description: "Ujian formatif akhir materi Struktur Data Tree dan Graph.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang struktur data secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Struktur Data tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Struktur Data"]
          },
          {
            id: "bk9_meeting2",
            number: 4,
            title: "Materi 2: Ekspresi dan Operasi Logika",
            description: "Memahami ekspresi dan berbagai operasi logika dalam komputasi.",
            objective: "Siswa mampu menerapkan operasi logika (AND, OR, NOT) dalam menyelesaikan masalah.",
            duration: "2 JP",
            summary: "Pelajari operasi dan ekspresi logika dengan video pembelajaran yang interaktif.",
            keywords: ["Ekspresi", "Operasi Logika", "AND", "OR", "NOT"]
          },
          {
            id: "bk9_meeting2_eval",
            number: 5,
            title: "Evaluasi Game: Ekspresi & Logika",
            description: "Game kuis interaktif untuk menguji pemahaman materi Ekspresi dan Operasi Logika.",
            objective: "Siswa mampu menjawab kuis terkait ekspresi dan operasi logika secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Operasi Logika melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Logika"]
          },
          {
            id: "bk9_meeting2_ujian",
            number: 6,
            title: "Ujian Akhir: Ekspresi & Logika",
            description: "Ujian formatif akhir materi Ekspresi dan Operasi Logika.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang logika secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Ekspresi Logika tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Logika"]
          },
          {
            id: "bk9_meeting3",
            number: 7,
            title: "Materi 3: Algoritma",
            description: "Mempelajari alur dan langkah-langkah algoritma secara sistematis.",
            objective: "Siswa mampu merancang algoritma untuk menyelesaikan suatu masalah.",
            duration: "2 JP",
            summary: "Pelajari cara menyusun dan membaca algoritma melalui video interaktif.",
            keywords: ["Algoritma", "Flowchart", "Sistematis"]
          },
          {
            id: "bk9_meeting3_eval",
            number: 8,
            title: "Evaluasi Game: Algoritma",
            description: "Game kuis interaktif untuk menguji pemahaman materi Algoritma.",
            objective: "Siswa mampu menjawab kuis terkait algoritma secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Algoritma melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Algoritma"]
          },
          {
            id: "bk9_meeting3_ujian",
            number: 9,
            title: "Ujian Akhir: Algoritma",
            description: "Ujian formatif akhir materi Algoritma.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang algoritma secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Algoritma tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Algoritma"]
          },
          {
            id: "bk9_meeting4",
            number: 10,
            title: "Materi 4: Pemrograman Visual (Pictoblox)",
            description: "Mengenal antarmuka dan konsep dasar pada pemrograman visual Pictoblox.",
            objective: "Siswa mampu menggunakan fitur dasar dan mendaftar akun di aplikasi Pictoblox.",
            duration: "2 JP",
            summary: "Pelajari cara mendaftar dan memahami antarmuka Pictoblox dari dasar.",
            keywords: ["Pictoblox", "Pemrograman Visual", "Scratch"]
          },
          {
            id: "bk9_meeting4_eval",
            number: 11,
            title: "Evaluasi Game: Pemrograman Visual",
            description: "Game kuis interaktif untuk menguji pemahaman materi Pemrograman Visual Pictoblox.",
            objective: "Siswa mampu menjawab kuis terkait Pictoblox secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Pemrograman Visual melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Pictoblox"]
          },
          {
            id: "bk9_meeting4_ujian",
            number: 12,
            title: "Ujian Akhir: Pemrograman Visual",
            description: "Ujian formatif akhir materi Pemrograman Visual Pictoblox.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang Pictoblox secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Pemrograman Visual tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Pictoblox"]
          },
          {
            id: "bk9_meeting5",
            number: 13,
            title: "Materi 5: Storytelling & Dialog",
            description: "Membuat cerita sederhana, dialog, dan storytelling menggunakan pemrograman visual.",
            objective: "Siswa mampu membuat proyek animasi cerita interaktif dengan dialog antar karakter.",
            duration: "2 JP",
            summary: "Pelajari cara menyusun dialog dan cerita sederhana melalui animasi blok.",
            keywords: ["Storytelling", "Dialog", "Animasi", "Pictoblox"]
          },
          {
            id: "bk9_meeting5_eval",
            number: 14,
            title: "Evaluasi Game: Storytelling",
            description: "Game kuis interaktif untuk menguji pemahaman materi Storytelling.",
            objective: "Siswa mampu menjawab kuis terkait dialog dan cerita dengan cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang pembuatan cerita melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Storytelling"]
          },
          {
            id: "bk9_meeting5_ujian",
            number: 15,
            title: "Ujian Akhir: Storytelling",
            description: "Ujian formatif akhir materi Storytelling dan Dialog.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang animasi cerita secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Storytelling tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Storytelling"]
          }
        ]
      },
      {
        id: "ld9",
        title: "Literasi Digital",
        code: "LD",
        description: "Memahami aspek etika, keamanan informasi, dan dampak teknologi terhadap masyarakat.",
        iconName: "ShieldCheck",
        meetings: [
          {
            id: "ld9_meeting1",
            number: 1,
            title: "Materi 1: Integrasi Aplikasi Perkantoran OLE",
            description: "Memahami integrasi aplikasi perkantoran menggunakan Object Linking and Embedding.",
            objective: "Siswa mampu mengintegrasikan data antar aplikasi perkantoran secara efisien.",
            duration: "2 JP",
            summary: "Pelajari integrasi aplikasi perkantoran OLE melalui video interaktif.",
            keywords: ["OLE", "Integrasi", "Perkantoran", "Word", "Excel", "PowerPoint"]
          },
          {
            id: "ld9_meeting1_eval",
            number: 2,
            title: "Evaluasi Game: Integrasi OLE",
            description: "Game kuis interaktif untuk menguji pemahaman materi Integrasi OLE.",
            objective: "Siswa mampu menjawab kuis terkait Integrasi OLE secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Integrasi OLE melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Integrasi OLE"]
          },
          {
            id: "ld9_meeting1_ujian",
            number: 3,
            title: "Ujian Akhir: Integrasi OLE",
            description: "Ujian formatif akhir materi Integrasi OLE.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang Integrasi OLE secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Integrasi OLE tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Integrasi OLE"]
          },
          {
            id: "ld9_meeting2",
            number: 4,
            title: "Materi 2: Pengolahan Konten Media Digital",
            description: "Memahami pengolahan konten, produksi vlog/blog, ruang publik virtual, dan jejak digital.",
            objective: "Siswa mampu memproduksi konten kreatif serta mengelola jejak digital di ruang publik virtual.",
            duration: "2 JP",
            summary: "Pelajari ruang publik virtual, produksi konten vlog/blog, dan pengelolaan jejak digital.",
            keywords: ["Konten", "Media Digital", "Jejak Digital", "Vlog", "Blog"]
          },
          {
            id: "ld9_meeting2_eval",
            number: 5,
            title: "Evaluasi Game: Konten Media Digital",
            description: "Game kuis interaktif untuk menguji pemahaman materi Konten Media Digital.",
            objective: "Siswa mampu menjawab kuis terkait Konten Media Digital secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Konten Media Digital melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Konten Digital"]
          },
          {
            id: "ld9_meeting2_ujian",
            number: 6,
            title: "Ujian Akhir: Konten Media Digital",
            description: "Ujian formatif akhir materi Konten Media Digital.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang Konten Media Digital secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Konten Media Digital tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Konten Digital"]
          },
          {
            id: "ld9_meeting3",
            number: 7,
            title: "Materi 3: Memilih Informasi Publik dan Pribadi",
            description: "Membedakan dan memilih informasi mana yang bersifat publik dan mana yang pribadi.",
            objective: "Siswa mampu mengidentifikasi dan memilah informasi publik dan pribadi secara bijak.",
            duration: "2 JP",
            summary: "Pelajari pentingnya membedakan informasi publik dan pribadi di dunia digital.",
            keywords: ["Informasi Publik", "Privasi", "Informasi Pribadi", "Data Diri"]
          },
          {
            id: "ld9_meeting3_eval",
            number: 8,
            title: "Evaluasi Game: Informasi Publik & Pribadi",
            description: "Game kuis interaktif untuk menguji pemahaman materi Informasi Publik & Pribadi.",
            objective: "Siswa mampu menjawab kuis terkait pemilahan informasi secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Informasi Publik & Pribadi melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Privasi"]
          },
          {
            id: "ld9_meeting3_ujian",
            number: 9,
            title: "Ujian Akhir: Informasi Publik & Pribadi",
            description: "Ujian formatif akhir materi Informasi Publik & Pribadi.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang Informasi Publik & Pribadi secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Informasi Publik & Pribadi tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Privasi"]
          },
          {
            id: "ld9_meeting4",
            number: 10,
            title: "Materi 4: Mengenali dan Menghindari Hoaks",
            description: "Cara efektif mengenali dan menghindari hoaks, serta validasi informasi di media sosial.",
            objective: "Siswa mampu melakukan validasi informasi dan menghindari penyebaran berita palsu (hoaks).",
            duration: "2 JP",
            summary: "Pelajari cara memvalidasi informasi di media sosial dan menghindari berita hoaks.",
            keywords: ["Hoaks", "Validasi", "Berita Palsu", "Media Sosial"]
          },
          {
            id: "ld9_meeting4_eval",
            number: 11,
            title: "Evaluasi Game: Mengenali Hoaks",
            description: "Game kuis interaktif untuk menguji pemahaman materi Mengenali dan Menghindari Hoaks.",
            objective: "Siswa mampu menjawab kuis terkait validasi informasi dan hoaks secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Cara Mengenali Hoaks melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Hoaks"]
          },
          {
            id: "ld9_meeting4_ujian",
            number: 12,
            title: "Ujian Akhir: Mengenali Hoaks",
            description: "Ujian formatif akhir materi Mengenali dan Menghindari Hoaks.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang validasi informasi secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Mengenali Hoaks tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Hoaks"]
          },
          {
            id: "ld9_meeting5",
            number: 13,
            title: "Materi 5: Autentikasi Digital & Kata Sandi Kuat",
            description: "Rahasia keamanan online, autentikasi digital, dan perlindungan akun.",
            objective: "Siswa mampu membuat kata sandi yang kuat dan menerapkan autentikasi digital untuk keamanan akun.",
            duration: "2 JP",
            summary: "Pelajari pentingnya kata sandi kuat dan metode autentikasi digital.",
            keywords: ["Keamanan", "Kata Sandi", "Autentikasi", "Password", "Akun"]
          },
          {
            id: "ld9_meeting5_eval",
            number: 14,
            title: "Evaluasi Game: Autentikasi Digital",
            description: "Game kuis interaktif untuk menguji pemahaman materi Autentikasi Digital.",
            objective: "Siswa mampu menjawab kuis terkait keamanan akun dan password secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Autentikasi Digital melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Keamanan", "Password"]
          },
          {
            id: "ld9_meeting5_ujian",
            number: 15,
            title: "Ujian Akhir: Autentikasi Digital",
            description: "Ujian formatif akhir materi Autentikasi Digital & Kata Sandi Kuat.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang keamanan akun secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Autentikasi Digital tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Keamanan", "Password"]
          },
          {
            id: "ld9_meeting6",
            number: 16,
            title: "Materi 6: Pengamanan Perangkat",
            description: "Langkah-langkah pengamanan perangkat keras dan perangkat lunak dari ancaman.",
            objective: "Siswa mampu mengamankan perangkat komputasinya dari berbagai ancaman keamanan.",
            duration: "2 JP",
            summary: "Pelajari cara melindungi dan mengamankan perangkat komputer dan smartphone.",
            keywords: ["Pengamanan", "Perangkat", "Keamanan", "Device"]
          },
          {
            id: "ld9_meeting6_eval",
            number: 17,
            title: "Evaluasi Game: Pengamanan Perangkat",
            description: "Game kuis interaktif untuk menguji pemahaman materi Pengamanan Perangkat.",
            objective: "Siswa mampu menjawab kuis terkait pengamanan perangkat secara cepat dan tepat.",
            duration: "40 Menit",
            summary: "Uji pemahamanmu tentang Pengamanan Perangkat melalui game interaktif berbatas waktu.",
            keywords: ["Kuis", "Game", "Evaluasi", "Pengamanan Perangkat"]
          },
          {
            id: "ld9_meeting6_ujian",
            number: 18,
            title: "Ujian Akhir: Pengamanan Perangkat",
            description: "Ujian formatif akhir materi Pengamanan Perangkat.",
            objective: "Siswa dapat mengevaluasi pemahaman teoretis tentang pengamanan perangkat secara komprehensif.",
            duration: "40 Menit",
            summary: "Kerjakan soal ujian akhir untuk materi Pengamanan Perangkat tanpa batasan waktu per soal.",
            keywords: ["Ujian", "Formatif", "Teori", "Pengamanan Perangkat"]
          }
        ]
      }
    ]
  }
];