import { curriculumData } from './curriculum';

export interface MpiGeneratedMaterial {
  id: string;
  mapel: string;
  kelas: string;
  judul: string;
  konten: string;
  link_video: string;
  created_at: string;
  is_mpi_curriculum: boolean;
  mpi_meeting_id: string;
}

let cachedMaterials: MpiGeneratedMaterial[] | null = null;

export function generateAllMpiMaterials(): MpiGeneratedMaterial[] {
  if (cachedMaterials) return cachedMaterials;

  const materials: MpiGeneratedMaterial[] = [];
  const baseTimestamp = 1720000000000;
  let offset = 0;

  curriculumData.forEach((gradeData) => {
    const grade = gradeData.grade;

    gradeData.chapters.forEach((chapter) => {
      chapter.meetings.forEach((meeting) => {
        offset++;
        const createdAt = new Date(baseTimestamp + offset * 100000).toISOString();

        let meetingTypeLabel = '';
        if (meeting.number === 0) {
          meetingTypeLabel = 'Materi Pokok Teori';
        } else if (meeting.id.includes('evaluasi')) {
          meetingTypeLabel = 'Evaluasi Game Berwaktu';
        } else if (meeting.id.includes('ujian')) {
          meetingTypeLabel = 'Ujian Akhir Bab';
        } else {
          meetingTypeLabel = `Pertemuan 0${meeting.number}`;
        }

        const structuredKonten = JSON.stringify({
          tipe: 'mpi_native',
          kategori: 'modul',
          level: 'menengah',
          deskripsi: `${meeting.description}${meeting.objective ? '\n\nTujuan: ' + meeting.objective : ''}${meeting.summary ? '\n\nRingkasan: ' + meeting.summary : ''}`,
          mpi_grade: grade,
          mpi_chapter_id: chapter.id,
          mpi_chapter_code: chapter.code,
          mpi_chapter_title: chapter.title,
          mpi_meeting_id: meeting.id,
          mpi_meeting_num: meeting.number,
          mpi_duration: meeting.duration || '2 JP',
          html_content: '',
          url_materi: ''
        });

        materials.push({
          id: `mpi_native_${meeting.id}`,
          mapel: 'Informatika',
          kelas: String(grade),
          judul: `[${chapter.code}] ${meetingTypeLabel}: ${meeting.title}`,
          konten: structuredKonten,
          link_video: '',
          created_at: createdAt,
          is_mpi_curriculum: true,
          mpi_meeting_id: meeting.id
        });
      });
    });
  });

  cachedMaterials = materials;
  return materials;
}
