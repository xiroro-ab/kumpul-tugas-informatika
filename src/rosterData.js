import { supabase } from './supabase.js';
import rosterSeed from './roster_seed.json';

export const initialStudents = rosterSeed;
const LOCAL_STORAGE_KEY = 'smp58_master_students';

export function getCachedStudents() {
    try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (_) {}
    return initialStudents;
}

export function setCachedStudents(students) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
    } catch (_) {}
}

/**
 * Mengambil seluruh data siswa dari Supabase.
 * Jika Supabase belum memiliki data, otomatis melakukan bootstrap/sync dengan data roster awal.
 */
export async function fetchStudentsFromDB() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('kelas', { ascending: true })
            .order('nama', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
            setCachedStudents(data);
            return data;
        }

        // Jika tabel kosong di Supabase, coba bootstrap data dari rosterSeed
        if (!error && Array.isArray(data) && data.length === 0) {
            console.log("Tabel students kosong di Supabase, melakukan bootstrap 301 siswa...");
            await syncRosterToDB(initialStudents);
            return initialStudents;
        }
    } catch (err) {
        console.warn("Gagal memuat students dari Supabase, menggunakan cache lokal:", err);
    }
    return getCachedStudents();
}

/**
 * Sinkronisasi / Upsert data siswa secara batch ke Supabase
 */
export async function syncRosterToDB(studentsList = initialStudents) {
    if (!Array.isArray(studentsList) || studentsList.length === 0) return { success: false, count: 0 };
    
    // Pecah batch masing-masing 50 baris agar aman dari limit payload
    const batchSize = 50;
    let totalSynced = 0;

    for (let i = 0; i < studentsList.length; i += batchSize) {
        const chunk = studentsList.slice(i, i + batchSize).map(s => ({
            id: String(s.id || s.nisn || `SMP58_${Date.now()}_${Math.random()}`).trim(),
            nisn: s.nisn ? String(s.nisn).trim() : '',
            nama: String(s.nama || s.nama_siswa || '').trim().toUpperCase(),
            jenis_kelamin: s.jenis_kelamin || 'Laki-Laki',
            kelas: String(s.kelas || 'VII.1').trim()
        }));

        try {
            const { error } = await supabase
                .from('students')
                .upsert(chunk, { onConflict: 'id' });

            if (!error) {
                totalSynced += chunk.length;
            } else {
                console.warn("Upsert batch warning:", error);
            }
        } catch (e) {
            console.warn("Sync chunk error:", e);
        }
    }

    setCachedStudents(studentsList);
    return { success: true, count: totalSynced };
}

/**
 * Tambah siswa baru ke database
 */
export async function addStudentToDB(student) {
    const newStudent = {
        id: String(student.id || student.nisn || `SMP58_${Date.now()}`).trim(),
        nisn: student.nisn ? String(student.nisn).trim() : '',
        nama: String(student.nama || '').trim().toUpperCase(),
        jenis_kelamin: student.jenis_kelamin || 'Laki-Laki',
        kelas: String(student.kelas || 'VII.1').trim()
    };

    try {
        const { error } = await supabase
            .from('students')
            .insert([newStudent]);
        if (error) throw error;
    } catch (e) {
        console.warn("Gagal simpan siswa ke Supabase, simpan lokal:", e);
    }

    const current = getCachedStudents();
    const existingIdx = current.findIndex(s => s.id === newStudent.id);
    if (existingIdx >= 0) {
        current[existingIdx] = newStudent;
    } else {
        current.push(newStudent);
    }
    setCachedStudents(current);
    return newStudent;
}

/**
 * Edit data siswa di database
 */
export async function updateStudentInDB(studentId, updatedData) {
    const payload = {
        nisn: updatedData.nisn ? String(updatedData.nisn).trim() : '',
        nama: String(updatedData.nama || '').trim().toUpperCase(),
        jenis_kelamin: updatedData.jenis_kelamin || 'Laki-Laki',
        kelas: String(updatedData.kelas || 'VII.1').trim()
    };

    try {
        const { error } = await supabase
            .from('students')
            .update(payload)
            .eq('id', studentId);
        if (error) throw error;
    } catch (e) {
        console.warn("Gagal update siswa di Supabase, update lokal:", e);
    }

    const current = getCachedStudents();
    const idx = current.findIndex(s => s.id === studentId);
    if (idx >= 0) {
        current[idx] = { ...current[idx], ...payload };
        setCachedStudents(current);
    }
    return true;
}

/**
 * Hapus data siswa dari database
 */
export async function deleteStudentFromDB(studentId) {
    try {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', studentId);
        if (error) throw error;
    } catch (e) {
        console.warn("Gagal hapus siswa di Supabase, hapus lokal:", e);
    }

    const current = getCachedStudents();
    const filtered = current.filter(s => s.id !== studentId);
    setCachedStudents(filtered);
    return true;
}

/**
 * Parse CSV teks dari file eksternal menjadi array objek siswa
 */
export function parseRosterCsvText(csvText) {
    const cleanedText = csvText.replace(/^\uFEFF/, '').trim();
    const lines = cleanedText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    const delimiter = (lines[0].split(';').length > lines[0].split(',').length) ? ';' : ',';
    const header = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    const nisnIdx = header.findIndex(h => h.includes('nisn') || h.includes('id') || h.includes('nomor'));
    const namaIdx = header.findIndex(h => h.includes('nama'));
    const jkIdx = header.findIndex(h => h.includes('kelamin') || h.includes('jk') || h.includes('gender'));
    const kelasIdx = header.findIndex(h => h.includes('kelas') || h.includes('rombel'));

    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 2) continue;

        const nama = namaIdx >= 0 ? cols[namaIdx] : cols[1];
        if (!nama) continue;

        let nisn = nisnIdx >= 0 ? cols[nisnIdx] : '';
        let kelas = kelasIdx >= 0 ? cols[kelasIdx] : (cols[4] || 'VII.1');
        let jk = jkIdx >= 0 ? cols[jkIdx] : (cols[3] || 'Laki-Laki');

        let id = nisn && nisn !== '-' && !nisn.toLowerCase().startsWith('kosong')
            ? nisn
            : `SMP58_${kelas.replace(/\./g, '_')}_${nama.replace(/\s+/g, '_')}`;

        result.push({
            id,
            nisn: nisn && nisn !== '-' ? nisn : '',
            nama: nama.toUpperCase(),
            jenis_kelamin: jk.toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-Laki',
            kelas: kelas
        });
    }
    return result;
}
