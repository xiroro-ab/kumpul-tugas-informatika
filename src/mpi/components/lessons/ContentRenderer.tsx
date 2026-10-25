import React from 'react';
import { Terminal, CheckCircle } from 'lucide-react';
import MateriTeori from './MateriTeori';
import Meeting1 from './Meeting1';
import Meeting2 from './Meeting2';
import Meeting3 from './Meeting3';
import Meeting4 from './Meeting4';
import EvaluasiAkhir from './EvaluasiAkhir';
import UjianAkhir from './UjianAkhir';
import TIKMeeting0 from './tik/TIKMeeting0';
import TIKMeeting1 from './tik/TIKMeeting1';
import TIKMeeting2 from './tik/TIKMeeting2';
import TIKMeeting3 from './tik/TIKMeeting3';
import TIKEvaluasiGame from './tik/TIKEvaluasiGame';
import TIKUjianAkhir from './tik/TIKUjianAkhir';
import SKMeeting0 from './sk/SKMeeting0';
import SKMeeting1 from './sk/SKMeeting1';
import SKMeeting2 from './sk/SKMeeting2';
import SKMeeting3 from './sk/SKMeeting3';
import SKMeeting4 from './sk/SKMeeting4';
import SKEvaluasiGame from './sk/SKEvaluasiGame';
import SKUjianAkhir from './sk/SKUjianAkhir';

import JKIMeeting0 from './jki/JKIMeeting0';
import JKIMeeting1 from './jki/JKIMeeting1';
import JKIMeeting2 from './jki/JKIMeeting2';
import JKIMeeting3 from './jki/JKIMeeting3';
import JKIMeeting4 from './jki/JKIMeeting4';
import JKIEvaluasiGame from './jki/JKIEvaluasiGame';
import JKIUjianAkhir from './jki/JKIUjianAkhir';

import ADMeeting0 from './ad/ADMeeting0';
import ADMeeting1 from './ad/ADMeeting1';
import ADMeeting2 from './ad/ADMeeting2';
import ADMeeting3 from './ad/ADMeeting3';
import ADEvaluasiGame from './ad/ADEvaluasiGame';
import ADUjianAkhir from './ad/ADUjianAkhir';
import APMeeting0 from './ap/APMeeting0';
import APMeeting1 from './ap/APMeeting1';
import APMeeting2 from './ap/APMeeting2';
import APEvaluasiGame from './ap/APEvaluasiGame';
import APUjianAkhir from './ap/APUjianAkhir';
import DSIMeeting0 from './dsi/DSIMeeting0';
import DSIMeeting1 from './dsi/DSIMeeting1';
import DSIMeeting2 from './dsi/DSIMeeting2';
import DSIEvaluasiGame from './dsi/DSIEvaluasiGame';
import DSIUjianAkhir from './dsi/DSIUjianAkhir';
import BK9Meeting1 from './bk9/BK9Meeting1';
import BK9Materi1Eval from './bk9/BK9Materi1Eval';
import BK9Materi1Ujian from './bk9/BK9Materi1Ujian';
import BK9Meeting2 from './bk9/BK9Meeting2';
import BK9Materi2Eval from './bk9/BK9Materi2Eval';
import BK9Materi2Ujian from './bk9/BK9Materi2Ujian';
import BK9Meeting3 from './bk9/BK9Meeting3';
import BK9Materi3Eval from './bk9/BK9Materi3Eval';
import BK9Materi3Ujian from './bk9/BK9Materi3Ujian';
import BK9Meeting5 from './bk9/BK9Meeting5';
import BK9Materi5Eval from './bk9/BK9Materi5Eval';
import BK9Materi5Ujian from './bk9/BK9Materi5Ujian';
import BK9Meeting4 from './bk9/BK9Meeting4';
import BK9Materi4Eval from './bk9/BK9Materi4Eval';
import BK9Materi4Ujian from './bk9/BK9Materi4Ujian';

import BK8Meeting0 from './bk8/BK8Meeting0';
import BK8Meeting1 from './bk8/BK8Meeting1';
import BK8Meeting2 from './bk8/BK8Meeting2';
import BK8Meeting3 from './bk8/BK8Meeting3';
import BK8EvaluasiGame from './bk8/BK8EvaluasiGame';
import BK8UjianAkhir from './bk8/BK8UjianAkhir';
import TIK8Meeting0 from './tik8/TIK8Meeting0';
import TIK8Meeting1 from './tik8/TIK8Meeting1';
import TIK8Meeting2 from './tik8/TIK8Meeting2';
import TIK8EvaluasiGame from './tik8/TIK8EvaluasiGame';
import TIK8UjianAkhir from './tik8/TIK8UjianAkhir';
import SK8Meeting0 from './sk8/SK8Meeting0';
import SK8Meeting1 from './sk8/SK8Meeting1';
import SK8Meeting2 from './sk8/SK8Meeting2';
import SK8Meeting3 from './sk8/SK8Meeting3';
import SK8EvaluasiGame from './sk8/SK8EvaluasiGame';
import SK8UjianAkhir from './sk8/SK8UjianAkhir';

import JKI8Meeting0 from './jki8/JKI8Meeting0';
import JKI8Meeting1 from './jki8/JKI8Meeting1';
import JKI8Meeting2 from './jki8/JKI8Meeting2';
import JKI8Meeting3 from './jki8/JKI8Meeting3';
import JKI8EvaluasiGame from './jki8/JKI8EvaluasiGame';
import JKI8UjianAkhir from './jki8/JKI8UjianAkhir';

// Analisis Data (AD) Kelas 8
import AD8Meeting0 from './ad8/AD8Meeting0';
import AD8Meeting1 from './ad8/AD8Meeting1';
import AD8Meeting2 from './ad8/AD8Meeting2';
import AD8Meeting3 from './ad8/AD8Meeting3';
import AD8EvaluasiGame from './ad8/AD8EvaluasiGame';
import AD8UjianAkhir from './ad8/AD8UjianAkhir';

import AP8Meeting0 from './ap8/AP8Meeting0';
import AP8Meeting1 from './ap8/AP8Meeting1';
import AP8Meeting2 from './ap8/AP8Meeting2';
import AP8EvaluasiGame from './ap8/AP8EvaluasiGame';
import AP8UjianAkhir from './ap8/AP8UjianAkhir';

import DSI8Meeting0 from './dsi8/DSI8Meeting0';
import DSI8Meeting1 from './dsi8/DSI8Meeting1';
import DSI8Meeting2 from './dsi8/DSI8Meeting2';
import DSI8Meeting3 from './dsi8/DSI8Meeting3';
import DSI8EvaluasiGame from './dsi8/DSI8EvaluasiGame';
import DSI8UjianAkhir from './dsi8/DSI8UjianAkhir';









import { Meeting } from '../../data/curriculum';

  
// Literasi Digital Kelas 9 (LD9)
import LD9Meeting1 from './ld9/LD9Meeting1';
import LD9Materi1Eval from './ld9/LD9Materi1Eval';
import LD9Materi1Ujian from './ld9/LD9Materi1Ujian';
import LD9Meeting2 from './ld9/LD9Meeting2';
import LD9Materi2Eval from './ld9/LD9Materi2Eval';
import LD9Materi2Ujian from './ld9/LD9Materi2Ujian';
import LD9Meeting3 from './ld9/LD9Meeting3';
import LD9Materi3Eval from './ld9/LD9Materi3Eval';
import LD9Materi3Ujian from './ld9/LD9Materi3Ujian';
import LD9Meeting4 from './ld9/LD9Meeting4';
import LD9Materi4Eval from './ld9/LD9Materi4Eval';
import LD9Materi4Ujian from './ld9/LD9Materi4Ujian';
import LD9Meeting5 from './ld9/LD9Meeting5';
import LD9Materi5Eval from './ld9/LD9Materi5Eval';
import LD9Materi5Ujian from './ld9/LD9Materi5Ujian';
import LD9Meeting6 from './ld9/LD9Meeting6';
import LD9Materi6Eval from './ld9/LD9Materi6Eval';
import LD9Materi6Ujian from './ld9/LD9Materi6Ujian';
interface ContentRendererProps {
  selectedMeeting: Meeting;
  completedMeetings: string[];
  handleCompleteMeeting: (id: string) => void;
}

export default function ContentRenderer({ selectedMeeting, completedMeetings, handleCompleteMeeting }: ContentRendererProps) {
  if (selectedMeeting.id === 'meeting0') {
    return (
      <MateriTeori
        onCompleteMeeting={() => handleCompleteMeeting('meeting0')}
        isCompleted={completedMeetings.includes('meeting0')}
      />
    );
  }

  if (selectedMeeting.id === 'meeting1') {
    return (
      <Meeting1
        onCompleteMeeting={() => handleCompleteMeeting('meeting1')}
        isCompleted={completedMeetings.includes('meeting1')}
      />
    );
  }
  
  if (selectedMeeting.id === 'meeting2') {
    return (
      <Meeting2
        onCompleteMeeting={() => handleCompleteMeeting('meeting2')}
        isCompleted={completedMeetings.includes('meeting2')}
      />
    );
  }
  
  if (selectedMeeting.id === 'meeting3') {
    return (
      <Meeting3
        onCompleteMeeting={() => handleCompleteMeeting('meeting3')}
        isCompleted={completedMeetings.includes('meeting3')}
      />
    );
  }
  
  if (selectedMeeting.id === 'meeting4') {
    return (
      <Meeting4
        onCompleteMeeting={() => handleCompleteMeeting('meeting4')}
        isCompleted={completedMeetings.includes('meeting4')}
      />
    );
  }

  if (selectedMeeting.id === 'evaluasi_game') {
    return (
      <EvaluasiAkhir
        onCompleteMeeting={() => handleCompleteMeeting('evaluasi_game')}
        isCompleted={completedMeetings.includes('evaluasi_game')}
      />
    );
  }

  if (selectedMeeting.id === 'evaluasi_akhir') {
    return (
      <UjianAkhir
        onCompleteMeeting={() => handleCompleteMeeting('evaluasi_akhir')}
        isCompleted={completedMeetings.includes('evaluasi_akhir')}
      />
    );
  }

  
  // TIK Meetings
  if (selectedMeeting.id === 'tik_meeting0') {
    return <TIKMeeting0 onCompleteMeeting={() => handleCompleteMeeting('tik_meeting0')} isCompleted={completedMeetings.includes('tik_meeting0')} />;
  }
  if (selectedMeeting.id === 'tik_meeting1') {
    return <TIKMeeting1 onCompleteMeeting={() => handleCompleteMeeting('tik_meeting1')} isCompleted={completedMeetings.includes('tik_meeting1')} />;
  }
  if (selectedMeeting.id === 'tik_meeting2') {
    return <TIKMeeting2 onCompleteMeeting={() => handleCompleteMeeting('tik_meeting2')} isCompleted={completedMeetings.includes('tik_meeting2')} />;
  }
  if (selectedMeeting.id === 'tik_meeting3') {
    return <TIKMeeting3 onCompleteMeeting={() => handleCompleteMeeting('tik_meeting3')} isCompleted={completedMeetings.includes('tik_meeting3')} />;
  }
  if (selectedMeeting.id === 'tik_evaluasi_game') {
    return <TIKEvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('tik_evaluasi_game')} isCompleted={completedMeetings.includes('tik_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'tik_evaluasi_akhir') {
    return <TIKUjianAkhir onCompleteMeeting={() => handleCompleteMeeting('tik_evaluasi_akhir')} isCompleted={completedMeetings.includes('tik_evaluasi_akhir')} />;
  }

  
  // SK Meetings
  if (selectedMeeting.id === 'sk_meeting0') {
    return <SKMeeting0 onCompleteMeeting={() => handleCompleteMeeting('sk_meeting0')} isCompleted={completedMeetings.includes('sk_meeting0')} />;
  }
  if (selectedMeeting.id === 'sk_meeting1') {
    return <SKMeeting1 onCompleteMeeting={() => handleCompleteMeeting('sk_meeting1')} isCompleted={completedMeetings.includes('sk_meeting1')} />;
  }
  if (selectedMeeting.id === 'sk_meeting2') {
    return <SKMeeting2 onCompleteMeeting={() => handleCompleteMeeting('sk_meeting2')} isCompleted={completedMeetings.includes('sk_meeting2')} />;
  }
  if (selectedMeeting.id === 'sk_meeting3') {
    return <SKMeeting3 onCompleteMeeting={() => handleCompleteMeeting('sk_meeting3')} isCompleted={completedMeetings.includes('sk_meeting3')} />;
  }
  if (selectedMeeting.id === 'sk_meeting4') {
    return <SKMeeting4 onCompleteMeeting={() => handleCompleteMeeting('sk_meeting4')} isCompleted={completedMeetings.includes('sk_meeting4')} />;
  }
  if (selectedMeeting.id === 'sk_evaluasi_game') {
    return <SKEvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('sk_evaluasi_game')} isCompleted={completedMeetings.includes('sk_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'sk_evaluasi_akhir') {
    return <SKUjianAkhir onCompleteMeeting={() => handleCompleteMeeting('sk_evaluasi_akhir')} isCompleted={completedMeetings.includes('sk_evaluasi_akhir')} />;
  }

  // JKI Meetings
  if (selectedMeeting.id === 'jki_meeting0') {
    return <JKIMeeting0 onCompleteMeeting={() => handleCompleteMeeting('jki_meeting0')} isCompleted={completedMeetings.includes('jki_meeting0')} />;
  }
  if (selectedMeeting.id === 'jki_meeting1') {
    return <JKIMeeting1 onCompleteMeeting={() => handleCompleteMeeting('jki_meeting1')} isCompleted={completedMeetings.includes('jki_meeting1')} />;
  }
  if (selectedMeeting.id === 'jki_meeting2') {
    return <JKIMeeting2 onCompleteMeeting={() => handleCompleteMeeting('jki_meeting2')} isCompleted={completedMeetings.includes('jki_meeting2')} />;
  }
  if (selectedMeeting.id === 'jki_meeting3') {
    return <JKIMeeting3 onCompleteMeeting={() => handleCompleteMeeting('jki_meeting3')} isCompleted={completedMeetings.includes('jki_meeting3')} />;
  }
  if (selectedMeeting.id === 'jki_meeting4') {
    return <JKIMeeting4 onCompleteMeeting={() => handleCompleteMeeting('jki_meeting4')} isCompleted={completedMeetings.includes('jki_meeting4')} />;
  }
  if (selectedMeeting.id === 'jki_evaluasi_game') {
    return <JKIEvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('jki_evaluasi_game')} isCompleted={completedMeetings.includes('jki_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'jki_evaluasi_akhir') {
    return <JKIUjianAkhir onCompleteMeeting={() => handleCompleteMeeting('jki_evaluasi_akhir')} isCompleted={completedMeetings.includes('jki_evaluasi_akhir')} />;
  }

  // AD Meetings
  if (selectedMeeting.id === 'ad_meeting0') {
    return <ADMeeting0 onCompleteMeeting={() => handleCompleteMeeting('ad_meeting0')} isCompleted={completedMeetings.includes('ad_meeting0')} />;
  }
  if (selectedMeeting.id === 'ad_meeting1') {
    return <ADMeeting1 onCompleteMeeting={() => handleCompleteMeeting('ad_meeting1')} isCompleted={completedMeetings.includes('ad_meeting1')} />;
  }
  if (selectedMeeting.id === 'ad_meeting2') {
    return <ADMeeting2 onCompleteMeeting={() => handleCompleteMeeting('ad_meeting2')} isCompleted={completedMeetings.includes('ad_meeting2')} />;
  }
  if (selectedMeeting.id === 'ad_meeting3') {
    return <ADMeeting3 onCompleteMeeting={() => handleCompleteMeeting('ad_meeting3')} isCompleted={completedMeetings.includes('ad_meeting3')} />;
  }
  if (selectedMeeting.id === 'ad_evaluasi_game') {
    return <ADEvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('ad_evaluasi_game')} isCompleted={completedMeetings.includes('ad_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'ad_evaluasi_akhir') {
    return <ADUjianAkhir onCompleteMeeting={() => handleCompleteMeeting('ad_evaluasi_akhir')} isCompleted={completedMeetings.includes('ad_evaluasi_akhir')} />;
  }




  // AP Meetings
  if (selectedMeeting.id === 'ap_meeting0') {
    return <APMeeting0 onCompleteMeeting={() => handleCompleteMeeting('ap_meeting0')} isCompleted={completedMeetings.includes('ap_meeting0')} />;
  }
  if (selectedMeeting.id === 'ap_meeting1') {
    return <APMeeting1 onCompleteMeeting={() => handleCompleteMeeting('ap_meeting1')} isCompleted={completedMeetings.includes('ap_meeting1')} />;
  }
  if (selectedMeeting.id === 'ap_meeting2') {
    return <APMeeting2 onCompleteMeeting={() => handleCompleteMeeting('ap_meeting2')} isCompleted={completedMeetings.includes('ap_meeting2')} />;
  }
  if (selectedMeeting.id === 'ap_evaluasi_game') {
    return <APEvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('ap_evaluasi_game')} isCompleted={completedMeetings.includes('ap_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'ap_evaluasi_akhir') {
    return <APUjianAkhir onCompleteMeeting={() => handleCompleteMeeting('ap_evaluasi_akhir')} isCompleted={completedMeetings.includes('ap_evaluasi_akhir')} />;
  }
    // DSI Meetings
  if (selectedMeeting.id === 'dsi_meeting0') {
    return <DSIMeeting0 onCompleteMeeting={() => handleCompleteMeeting('dsi_meeting0')} isCompleted={completedMeetings.includes('dsi_meeting0')} />;
  }
  if (selectedMeeting.id === 'dsi_meeting1') {
    return <DSIMeeting1 onCompleteMeeting={() => handleCompleteMeeting('dsi_meeting1')} isCompleted={completedMeetings.includes('dsi_meeting1')} />;
  }
  if (selectedMeeting.id === 'dsi_meeting2') {
    return <DSIMeeting2 onCompleteMeeting={() => handleCompleteMeeting('dsi_meeting2')} isCompleted={completedMeetings.includes('dsi_meeting2')} />;
  }
  if (selectedMeeting.id === 'dsi_evaluasi_game') {
    return <DSIEvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('dsi_evaluasi_game')} isCompleted={completedMeetings.includes('dsi_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'dsi_evaluasi_akhir') {
    return <DSIUjianAkhir onCompleteMeeting={() => handleCompleteMeeting('dsi_evaluasi_akhir')} isCompleted={completedMeetings.includes('dsi_evaluasi_akhir')} />;
  }

  

  // BK9 Meetings
  if (selectedMeeting.id === 'bk9_meeting1') return <BK9Meeting1 onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting1')} isCompleted={completedMeetings.includes('bk9_meeting1')} />;
  if (selectedMeeting.id === 'bk9_meeting1_eval') return <BK9Materi1Eval onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting1_eval')} isCompleted={completedMeetings.includes('bk9_meeting1_eval')} />;
  if (selectedMeeting.id === 'bk9_meeting1_ujian') return <BK9Materi1Ujian onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting1_ujian')} isCompleted={completedMeetings.includes('bk9_meeting1_ujian')} />;
  
  if (selectedMeeting.id === 'bk9_meeting2') return <BK9Meeting2 onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting2')} isCompleted={completedMeetings.includes('bk9_meeting2')} />;
  if (selectedMeeting.id === 'bk9_meeting2_eval') return <BK9Materi2Eval onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting2_eval')} isCompleted={completedMeetings.includes('bk9_meeting2_eval')} />;
  if (selectedMeeting.id === 'bk9_meeting2_ujian') return <BK9Materi2Ujian onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting2_ujian')} isCompleted={completedMeetings.includes('bk9_meeting2_ujian')} />;
  
  if (selectedMeeting.id === 'bk9_meeting3') return <BK9Meeting3 onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting3')} isCompleted={completedMeetings.includes('bk9_meeting3')} />;
  if (selectedMeeting.id === 'bk9_meeting3_eval') return <BK9Materi3Eval onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting3_eval')} isCompleted={completedMeetings.includes('bk9_meeting3_eval')} />;
  if (selectedMeeting.id === 'bk9_meeting3_ujian') return <BK9Materi3Ujian onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting3_ujian')} isCompleted={completedMeetings.includes('bk9_meeting3_ujian')} />;
  
  if (selectedMeeting.id === 'bk9_meeting4') return <BK9Meeting4 onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting4')} isCompleted={completedMeetings.includes('bk9_meeting4')} />;
  if (selectedMeeting.id === 'bk9_meeting4_eval') return <BK9Materi4Eval onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting4_eval')} isCompleted={completedMeetings.includes('bk9_meeting4_eval')} />;
  if (selectedMeeting.id === 'bk9_meeting4_ujian') return <BK9Materi4Ujian onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting4_ujian')} isCompleted={completedMeetings.includes('bk9_meeting4_ujian')} />;

  
  if (selectedMeeting.id === 'bk9_meeting5') return <BK9Meeting5 onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting5')} isCompleted={completedMeetings.includes('bk9_meeting5')} />;
  if (selectedMeeting.id === 'bk9_meeting5_eval') return <BK9Materi5Eval onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting5_eval')} isCompleted={completedMeetings.includes('bk9_meeting5_eval')} />;
  if (selectedMeeting.id === 'bk9_meeting5_ujian') return <BK9Materi5Ujian onCompleteMeeting={() => handleCompleteMeeting('bk9_meeting5_ujian')} isCompleted={completedMeetings.includes('bk9_meeting5_ujian')} />;
  
  if (selectedMeeting.id === 'ld9_coming_soon') {
    return (
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Segera Hadir</h2>
        <p className="text-slate-400">Materi Literasi Digital sedang dalam tahap pengembangan dan akan dirilis pada pembaruan berikutnya.</p>
        <button onClick={() => handleCompleteMeeting('ld9_coming_soon')} className="mt-6 bg-cyan-500 text-white px-6 py-2 rounded-xl">Tandai Dibaca</button>
      </div>
    );
  }

  // BK8 Meetings
  if (selectedMeeting.id === 'bk8_meeting0') {
    return <BK8Meeting0 onCompleteMeeting={() => handleCompleteMeeting('bk8_meeting0')} isCompleted={completedMeetings.includes('bk8_meeting0')} />;
  }
  if (selectedMeeting.id === 'bk8_meeting1') {
    return <BK8Meeting1 onCompleteMeeting={() => handleCompleteMeeting('bk8_meeting1')} isCompleted={completedMeetings.includes('bk8_meeting1')} />;
  }
  if (selectedMeeting.id === 'bk8_meeting2') {
    return <BK8Meeting2 onCompleteMeeting={() => handleCompleteMeeting('bk8_meeting2')} isCompleted={completedMeetings.includes('bk8_meeting2')} />;
  }
  if (selectedMeeting.id === 'bk8_meeting3') {
    return <BK8Meeting3 onCompleteMeeting={() => handleCompleteMeeting('bk8_meeting3')} isCompleted={completedMeetings.includes('bk8_meeting3')} />;
  }
  if (selectedMeeting.id === 'bk8_evaluasi_game') {
    return <BK8EvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('bk8_evaluasi_game')} isCompleted={completedMeetings.includes('bk8_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'bk8_evaluasi_akhir') {
    return <BK8UjianAkhir onCompleteMeeting={() => handleCompleteMeeting('bk8_evaluasi_akhir')} isCompleted={completedMeetings.includes('bk8_evaluasi_akhir')} />;
  }

  
  // TIK8 Meetings
  if (selectedMeeting.id === 'tik8_meeting0') {
    return <TIK8Meeting0 onCompleteMeeting={() => handleCompleteMeeting('tik8_meeting0')} isCompleted={completedMeetings.includes('tik8_meeting0')} />;
  }
  if (selectedMeeting.id === 'tik8_meeting1') {
    return <TIK8Meeting1 onCompleteMeeting={() => handleCompleteMeeting('tik8_meeting1')} isCompleted={completedMeetings.includes('tik8_meeting1')} />;
  }
  if (selectedMeeting.id === 'tik8_meeting2') {
    return <TIK8Meeting2 onCompleteMeeting={() => handleCompleteMeeting('tik8_meeting2')} isCompleted={completedMeetings.includes('tik8_meeting2')} />;
  }
  if (selectedMeeting.id === 'tik8_evaluasi_game') {
    return <TIK8EvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('tik8_evaluasi_game')} isCompleted={completedMeetings.includes('tik8_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'tik8_evaluasi_akhir') {
    return <TIK8UjianAkhir onCompleteMeeting={() => handleCompleteMeeting('tik8_evaluasi_akhir')} isCompleted={completedMeetings.includes('tik8_evaluasi_akhir')} />;
  }

  
  // SK8 Meetings
  if (selectedMeeting.id === 'sk8_meeting0') {
    return <SK8Meeting0 onCompleteMeeting={() => handleCompleteMeeting('sk8_meeting0')} isCompleted={completedMeetings.includes('sk8_meeting0')} />;
  }
  if (selectedMeeting.id === 'sk8_meeting1') {
    return <SK8Meeting1 onCompleteMeeting={() => handleCompleteMeeting('sk8_meeting1')} isCompleted={completedMeetings.includes('sk8_meeting1')} />;
  }
  if (selectedMeeting.id === 'sk8_meeting2') {
    return <SK8Meeting2 onCompleteMeeting={() => handleCompleteMeeting('sk8_meeting2')} isCompleted={completedMeetings.includes('sk8_meeting2')} />;
  }
  if (selectedMeeting.id === 'sk8_meeting3') {
    return <SK8Meeting3 onCompleteMeeting={() => handleCompleteMeeting('sk8_meeting3')} isCompleted={completedMeetings.includes('sk8_meeting3')} />;
  }
  if (selectedMeeting.id === 'sk8_evaluasi_game') {
    return <SK8EvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('sk8_evaluasi_game')} isCompleted={completedMeetings.includes('sk8_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'sk8_evaluasi_akhir') {
    return <SK8UjianAkhir onCompleteMeeting={() => handleCompleteMeeting('sk8_evaluasi_akhir')} isCompleted={completedMeetings.includes('sk8_evaluasi_akhir')} />;
  }

  
  // JKI8 Meetings
  if (selectedMeeting.id === 'jki8_meeting0') {
    return <JKI8Meeting0 onCompleteMeeting={() => handleCompleteMeeting('jki8_meeting0')} isCompleted={completedMeetings.includes('jki8_meeting0')} />;
  }
  if (selectedMeeting.id === 'jki8_meeting1') {
    return <JKI8Meeting1 onCompleteMeeting={() => handleCompleteMeeting('jki8_meeting1')} isCompleted={completedMeetings.includes('jki8_meeting1')} />;
  }
  if (selectedMeeting.id === 'jki8_meeting2') {
    return <JKI8Meeting2 onCompleteMeeting={() => handleCompleteMeeting('jki8_meeting2')} isCompleted={completedMeetings.includes('jki8_meeting2')} />;
  }
  if (selectedMeeting.id === 'jki8_meeting3') {
    return <JKI8Meeting3 onCompleteMeeting={() => handleCompleteMeeting('jki8_meeting3')} isCompleted={completedMeetings.includes('jki8_meeting3')} />;
  }
  if (selectedMeeting.id === 'jki8_evaluasi_game') {
    return <JKI8EvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('jki8_evaluasi_game')} isCompleted={completedMeetings.includes('jki8_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'jki8_evaluasi_akhir') {
    return <JKI8UjianAkhir onCompleteMeeting={() => handleCompleteMeeting('jki8_evaluasi_akhir')} isCompleted={completedMeetings.includes('jki8_evaluasi_akhir')} />;
  }

  // Analisis Data (AD) Kelas 8
  if (selectedMeeting.id === 'ad8_meeting0') {
    return <AD8Meeting0 onCompleteMeeting={() => handleCompleteMeeting('ad8_meeting0')} isCompleted={completedMeetings.includes('ad8_meeting0')} />;
  }
  if (selectedMeeting.id === 'ad8_meeting1') {
    return <AD8Meeting1 onCompleteMeeting={() => handleCompleteMeeting('ad8_meeting1')} isCompleted={completedMeetings.includes('ad8_meeting1')} />;
  }
  if (selectedMeeting.id === 'ad8_meeting2') {
    return <AD8Meeting2 onCompleteMeeting={() => handleCompleteMeeting('ad8_meeting2')} isCompleted={completedMeetings.includes('ad8_meeting2')} />;
  }
  if (selectedMeeting.id === 'ad8_meeting3') {
    return <AD8Meeting3 onCompleteMeeting={() => handleCompleteMeeting('ad8_meeting3')} isCompleted={completedMeetings.includes('ad8_meeting3')} />;
  }
  if (selectedMeeting.id === 'ad8_evaluasi_game') {
    return <AD8EvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('ad8_evaluasi_game')} isCompleted={completedMeetings.includes('ad8_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'ad8_evaluasi_akhir') {
    return <AD8UjianAkhir onCompleteMeeting={() => handleCompleteMeeting('ad8_evaluasi_akhir')} isCompleted={completedMeetings.includes('ad8_evaluasi_akhir')} />;
  }

  
  // AP Kelas 8
  if (selectedMeeting.id === 'ap8_meeting0') {
    return <AP8Meeting0 onCompleteMeeting={() => handleCompleteMeeting('ap8_meeting0')} isCompleted={completedMeetings.includes('ap8_meeting0')} />;
  }
  if (selectedMeeting.id === 'ap8_meeting1') {
    return <AP8Meeting1 onCompleteMeeting={() => handleCompleteMeeting('ap8_meeting1')} isCompleted={completedMeetings.includes('ap8_meeting1')} />;
  }
  if (selectedMeeting.id === 'ap8_meeting2') {
    return <AP8Meeting2 onCompleteMeeting={() => handleCompleteMeeting('ap8_meeting2')} isCompleted={completedMeetings.includes('ap8_meeting2')} />;
  }
  if (selectedMeeting.id === 'ap8_evaluasi_game') {
    return <AP8EvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('ap8_evaluasi_game')} isCompleted={completedMeetings.includes('ap8_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'ap8_evaluasi_akhir') {
    return <AP8UjianAkhir onCompleteMeeting={() => handleCompleteMeeting('ap8_evaluasi_akhir')} isCompleted={completedMeetings.includes('ap8_evaluasi_akhir')} />;
  }

  

// DSI Kelas 8
  if (selectedMeeting.id === 'dsi8_meeting0') {
    return <DSI8Meeting0 onCompleteMeeting={() => handleCompleteMeeting('dsi8_meeting0')} isCompleted={completedMeetings.includes('dsi8_meeting0')} />;
  }
  if (selectedMeeting.id === 'dsi8_meeting1') {
    return <DSI8Meeting1 onCompleteMeeting={() => handleCompleteMeeting('dsi8_meeting1')} isCompleted={completedMeetings.includes('dsi8_meeting1')} />;
  }
  if (selectedMeeting.id === 'dsi8_meeting2') {
    return <DSI8Meeting2 onCompleteMeeting={() => handleCompleteMeeting('dsi8_meeting2')} isCompleted={completedMeetings.includes('dsi8_meeting2')} />;
  }
  if (selectedMeeting.id === 'dsi8_meeting3') {
    return <DSI8Meeting3 onCompleteMeeting={() => handleCompleteMeeting('dsi8_meeting3')} isCompleted={completedMeetings.includes('dsi8_meeting3')} />;
  }
  if (selectedMeeting.id === 'dsi8_evaluasi_game') {
    return <DSI8EvaluasiGame onCompleteMeeting={() => handleCompleteMeeting('dsi8_evaluasi_game')} isCompleted={completedMeetings.includes('dsi8_evaluasi_game')} />;
  }
  if (selectedMeeting.id === 'dsi8_evaluasi_akhir') {
    return <DSI8UjianAkhir onCompleteMeeting={() => handleCompleteMeeting('dsi8_evaluasi_akhir')} isCompleted={completedMeetings.includes('dsi8_evaluasi_akhir')} />;
  }

  
  // Literasi Digital (LD) Kelas 9
  if (selectedMeeting.id === 'ld9_meeting1') { return <LD9Meeting1 onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting1')} isCompleted={completedMeetings.includes('ld9_meeting1')} />; }
  if (selectedMeeting.id === 'ld9_meeting1_eval') { return <LD9Materi1Eval onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting1_eval')} isCompleted={completedMeetings.includes('ld9_meeting1_eval')} />; }
  if (selectedMeeting.id === 'ld9_meeting1_ujian') { return <LD9Materi1Ujian onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting1_ujian')} isCompleted={completedMeetings.includes('ld9_meeting1_ujian')} />; }
  if (selectedMeeting.id === 'ld9_meeting2') { return <LD9Meeting2 onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting2')} isCompleted={completedMeetings.includes('ld9_meeting2')} />; }
  if (selectedMeeting.id === 'ld9_meeting2_eval') { return <LD9Materi2Eval onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting2_eval')} isCompleted={completedMeetings.includes('ld9_meeting2_eval')} />; }
  if (selectedMeeting.id === 'ld9_meeting2_ujian') { return <LD9Materi2Ujian onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting2_ujian')} isCompleted={completedMeetings.includes('ld9_meeting2_ujian')} />; }
  if (selectedMeeting.id === 'ld9_meeting3') { return <LD9Meeting3 onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting3')} isCompleted={completedMeetings.includes('ld9_meeting3')} />; }
  if (selectedMeeting.id === 'ld9_meeting3_eval') { return <LD9Materi3Eval onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting3_eval')} isCompleted={completedMeetings.includes('ld9_meeting3_eval')} />; }
  if (selectedMeeting.id === 'ld9_meeting3_ujian') { return <LD9Materi3Ujian onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting3_ujian')} isCompleted={completedMeetings.includes('ld9_meeting3_ujian')} />; }
  if (selectedMeeting.id === 'ld9_meeting4') { return <LD9Meeting4 onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting4')} isCompleted={completedMeetings.includes('ld9_meeting4')} />; }
  if (selectedMeeting.id === 'ld9_meeting4_eval') { return <LD9Materi4Eval onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting4_eval')} isCompleted={completedMeetings.includes('ld9_meeting4_eval')} />; }
  if (selectedMeeting.id === 'ld9_meeting4_ujian') { return <LD9Materi4Ujian onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting4_ujian')} isCompleted={completedMeetings.includes('ld9_meeting4_ujian')} />; }
  if (selectedMeeting.id === 'ld9_meeting5') { return <LD9Meeting5 onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting5')} isCompleted={completedMeetings.includes('ld9_meeting5')} />; }
  if (selectedMeeting.id === 'ld9_meeting5_eval') { return <LD9Materi5Eval onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting5_eval')} isCompleted={completedMeetings.includes('ld9_meeting5_eval')} />; }
  if (selectedMeeting.id === 'ld9_meeting5_ujian') { return <LD9Materi5Ujian onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting5_ujian')} isCompleted={completedMeetings.includes('ld9_meeting5_ujian')} />; }
  if (selectedMeeting.id === 'ld9_meeting6') { return <LD9Meeting6 onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting6')} isCompleted={completedMeetings.includes('ld9_meeting6')} />; }
  if (selectedMeeting.id === 'ld9_meeting6_eval') { return <LD9Materi6Eval onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting6_eval')} isCompleted={completedMeetings.includes('ld9_meeting6_eval')} />; }
  if (selectedMeeting.id === 'ld9_meeting6_ujian') { return <LD9Materi6Ujian onCompleteMeeting={() => handleCompleteMeeting('ld9_meeting6_ujian')} isCompleted={completedMeetings.includes('ld9_meeting6_ujian')} />; }

  // Fallback for other unmapped meetings

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-6 backdrop-blur-xl">
      <div className="mx-auto max-w-md space-y-4">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-md">
          <Terminal className="h-6 w-6 animate-pulse" />
        </div>
        
        <h3 className="text-xl font-extrabold text-white tracking-tight">Materi Segera Rilis</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
          Materi untuk "{selectedMeeting.title}" sedang disiapkan oleh tim kurikulum MPI Informatika SMP. Coba selesaikan bab Berpikir Komputasional terlebih dahulu!
        </p>

        <button
          id="simulate-complete-btn"
          onClick={() => handleCompleteMeeting(selectedMeeting.id)}
          className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 hover:border-cyan-400 transition-all cursor-pointer shadow-md"
        >
          <CheckCircle className="h-4 w-4 text-cyan-400" />
          <span>Simulasikan Penyelesaian Kelas</span>
        </button>
      </div>
    </div>
  );
}
