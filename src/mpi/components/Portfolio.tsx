import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, Instagram, Github, Mail, ExternalLink, Code, Layout, Smartphone, Menu, X } from "lucide-react";

interface PortfolioProps {
  onBack: () => void;
}

// Physics Constants
const GRAVITY = 0.9;
const DAMPING = 0.985;
const CONSTRAINT_ITERATIONS = 40;
const ROPE_SEGMENTS = 10;
const SEG_LEN = 16;
const CARD_H = 380;

export default function Portfolio({ onBack }: PortfolioProps) {
  const [activeSection, setActiveSection] = useState('home');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Physics state
  const pointsRef = useRef<any[]>([]);
  const segLensRef = useRef<number[]>([]);
  const draggedPointRef = useRef<any>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const pointerRef = useRef({ x: 0, y: 0 });
  const anchorPosRef = useRef({ x: 0, y: -20 });

  // Scroll Spy and Navbar Hide/Show using IntersectionObserver
  useEffect(() => {
    // 1. Intersection Observer for Scroll Spy
    const sections = ['home', 'portofolio', 'youtube', 'kontak'];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, {
      root: null, // Use the viewport
      rootMargin: '-50% 0px -50% 0px', // Trigger when section hits the vertical center
      threshold: 0
    });

    sections.forEach(section => {
      const el = document.getElementById(section);
      if (el) observer.observe(el);
    });

    // 2. Scroll event for Hide/Show Navbar (Handle both window and possible scrollable container)
    let ticking = false;
    const handleScroll = (e: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Determine scroll target (window or specific container)
          const target = e.target === document ? window : (e.target as HTMLElement);
          const scrollY = target === window ? window.scrollY : (target as HTMLElement).scrollTop;
          
          // Hide/Show Navbar
          if (scrollY > lastScrollY.current && scrollY > 50) {
            setIsNavVisible(false);
          } else {
            setIsNavVisible(true);
          }
          lastScrollY.current = scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Listen to window and capture phase to catch scrolls in internal containers
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      sections.forEach(section => {
        const el = document.getElementById(section);
        if (el) observer.unobserve(el);
      });
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  useEffect(() => {
    const points: any[] = [];
    const segLens: number[] = [];

    // Initialize Rope
    for (let i = 0; i < ROPE_SEGMENTS; i++) {
      points.push({ x: 0, y: i * SEG_LEN, oldx: 0, oldy: i * SEG_LEN, pinned: i === 0 });
      if (i > 0) segLens.push(SEG_LEN);
    }
    
    // Initialize Card Bob (center of mass)
    points.push({ x: 0, y: ROPE_SEGMENTS * SEG_LEN + CARD_H * 0.45, oldx: 0, oldy: ROPE_SEGMENTS * SEG_LEN + CARD_H * 0.45, pinned: false });
    segLens.push(CARD_H * 0.45);

    pointsRef.current = points;
    segLensRef.current = segLens;

    let animationFrameId: number;

    const integrate = () => {
      const pts = pointsRef.current;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.pinned || p === draggedPointRef.current) continue;
        const localDamping = DAMPING - i * 0.001; // Less damping at top, more at bottom
        const vx = (p.x - p.oldx) * localDamping;
        const vy = (p.y - p.oldy) * localDamping;
        p.oldx = p.x;
        p.oldy = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
      }
    };

    const satisfyConstraints = () => {
      const pts = pointsRef.current;
      const slens = segLensRef.current;
      
      for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const restLen = slens[i];
          const stiffness = 0.98;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          const diff = (dist - restLen) / dist;

          const p1Locked = p1.pinned || p1 === draggedPointRef.current;
          const p2Locked = p2.pinned || p2 === draggedPointRef.current;
          if (p1Locked && p2Locked) continue;

          const offX = dx * 0.5 * diff * stiffness;
          const offY = dy * 0.5 * diff * stiffness;

          if (!p1Locked) { p1.x += offX; p1.y += offY; }
          if (!p2Locked) { p2.x -= offX; p2.y -= offY; }
        }
        
        // Pin anchor
        pts[0].x = anchorPosRef.current.x;
        pts[0].y = anchorPosRef.current.y;
      }
    };

    const applyDrag = () => {
      if (!draggedPointRef.current) return;
      draggedPointRef.current.x += (pointerRef.current.x - dragOffsetRef.current.x - draggedPointRef.current.x) * 0.6;
      draggedPointRef.current.y += (pointerRef.current.y - dragOffsetRef.current.y - draggedPointRef.current.y) * 0.6;
    };

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const pts = pointsRef.current;
      
      // Draw Strap (Thick Black Ribbon)
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 36;
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'bevel';
      
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < ROPE_SEGMENTS; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Highlight for fabric depth
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 32;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < ROPE_SEGMENTS; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Draw Text on Strap
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textIdx = ROPE_SEGMENTS - 3;
      if (pts[textIdx] && pts[textIdx+1]) {
        const p1 = pts[textIdx];
        const p2 = pts[textIdx+1];
        const cx = (p1.x + p2.x) / 2;
        const cy = (p1.y + p2.y) / 2;
        let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle - Math.PI/2);
        ctx.fillText('A.B', 0, 0);
        ctx.restore();
      }

      // Sync DOM Card position
      if (cardRef.current) {
        const hook = pts[ROPE_SEGMENTS - 1];
        const bob = pts[pts.length - 1];
        let angle = Math.atan2(bob.y - hook.y, bob.x - hook.x) - Math.PI / 2;
        
        const cardX = hook.x - 130; // Half of 260px width
        const cardY = hook.y + 25; // Offset by the -25px transform origin
        
        cardRef.current.style.transform = `translate3d(${cardX}px, ${cardY}px, 0) rotate(${angle}rad)`;
      }
    };

    const loop = () => {
      applyDrag();
      integrate();
      satisfyConstraints();
      render();
      animationFrameId = requestAnimationFrame(loop);
    };
    
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.parentElement!.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        anchorPosRef.current = {
          x: rect.width >= 768 ? rect.width * 0.25 : rect.width / 2,
          y: -20
        };
        // Setup initial positions on first load if they are 0
        if (pointsRef.current[0].x === 0) {
           for (let i = 0; i < pointsRef.current.length; i++) {
              pointsRef.current[i].x = anchorPosRef.current.x;
              pointsRef.current[i].oldx = anchorPosRef.current.x;
           }
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Global pointer handlers
  useEffect(() => {
    const handlePointerMoveWindow = (e: PointerEvent) => {
      if (!draggedPointRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handlePointerUpWindow = () => {
      if (draggedPointRef.current) {
        draggedPointRef.current = null;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('pointermove', handlePointerMoveWindow);
    window.addEventListener('pointerup', handlePointerUpWindow);

    return () => {
      window.removeEventListener('pointermove', handlePointerMoveWindow);
      window.removeEventListener('pointerup', handlePointerUpWindow);
    };
  }, []);

  const startCardDrag = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    pointerRef.current = { x: px, y: py };
    
    const pts = pointsRef.current;
    if (pts.length > 0) {
      draggedPointRef.current = pts[pts.length - 1]; // Bob
      dragOffsetRef.current = {
        x: px - draggedPointRef.current.x,
        y: py - draggedPointRef.current.y
      };
      document.body.style.cursor = 'grabbing';
    }
  };

  return (
    <div className="min-h-screen bg-[#151515] text-slate-100 font-sans selection:bg-white/20 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .bg-grid {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }
        html { scroll-behavior: smooth; }
      `}</style>
      
      {/* Background Grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none z-0" />

      {/* Desktop NAVBAR */}
      <nav className={`hidden md:block fixed left-1/2 -translate-x-1/2 w-[95%] lg:w-[85%] max-w-[1200px] z-50 transition-all duration-500 ease-in-out ${isNavVisible ? 'top-14 opacity-100' : '-top-32 opacity-0'}`}>
        <div className="bg-[#242424]/40 backdrop-blur-xl rounded-full px-8 py-5 flex items-center justify-between shadow-2xl border border-white/10">
          <div className="font-poppins font-black text-3xl tracking-tighter text-white flex-shrink-0">
            A.B
          </div>
          <div className="flex-1 flex justify-center items-center gap-10 text-[15px] font-semibold text-slate-300 font-poppins">
            <a href="#home" className={`transition-all relative ${activeSection === 'home' ? 'text-white font-bold' : 'hover:text-white'} after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-[2px] after:bg-white after:transition-transform after:origin-center ${activeSection === 'home' ? 'after:scale-x-100' : 'after:scale-x-0'}`}>Home</a>
            <a href="#portofolio" className={`transition-all relative ${activeSection === 'portofolio' ? 'text-white font-bold' : 'hover:text-white'} after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-[2px] after:bg-white after:transition-transform after:origin-center ${activeSection === 'portofolio' ? 'after:scale-x-100' : 'after:scale-x-0'}`}>Portofolio</a>
            <a href="#youtube" className={`transition-all relative ${activeSection === 'youtube' ? 'text-white font-bold' : 'hover:text-white'} after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-[2px] after:bg-white after:transition-transform after:origin-center ${activeSection === 'youtube' ? 'after:scale-x-100' : 'after:scale-x-0'}`}>YouTube</a>
            <a href="#kontak" className={`transition-all relative ${activeSection === 'kontak' ? 'text-white font-bold' : 'hover:text-white'} after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-[2px] after:bg-white after:transition-transform after:origin-center ${activeSection === 'kontak' ? 'after:scale-x-100' : 'after:scale-x-0'}`}>Kontak</a>
          </div>
          <div className="flex-shrink-0">
            <button onClick={onBack} className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-extrabold font-poppins hover:scale-105 transition-transform shadow-lg">
              @Xiroro-3DMODEL
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile NAVBAR Button */}
      <nav className={`md:hidden fixed top-6 right-6 z-50 transition-all duration-500 ${isNavVisible || isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-20'}`}>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 bg-[#242424]/80 backdrop-blur-md rounded-full border border-white/10 text-white shadow-xl">
          <Menu className="w-6 h-6" />
        </button>
      </nav>
      
      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`absolute top-0 right-0 w-64 h-full bg-[#1c1c1c] border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col p-6 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-10">
            <div className="font-poppins font-black text-2xl text-white">Aris</div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col gap-6 text-lg font-medium text-slate-300">
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className={activeSection === 'home' ? 'text-white font-bold' : 'hover:text-white'}>Home</a>
            <a href="#portofolio" onClick={() => setIsMobileMenuOpen(false)} className={activeSection === 'portofolio' ? 'text-white font-bold' : 'hover:text-white'}>Portofolio</a>
            <a href="#youtube" onClick={() => setIsMobileMenuOpen(false)} className={activeSection === 'youtube' ? 'text-white font-bold' : 'hover:text-white'}>YouTube</a>
            <a href="#kontak" onClick={() => setIsMobileMenuOpen(false)} className={activeSection === 'kontak' ? 'text-white font-bold' : 'hover:text-white'}>Kontak</a>
          </div>
          <div className="mt-auto pb-8">
            <button onClick={onBack} className="w-full bg-white text-black py-3 rounded-full font-bold shadow-lg">@Xiroro-3DMODEL</button>
          </div>
        </div>
      </div>

      <main className="relative z-10 pt-24 md:pt-40 pb-20 px-4 w-full flex flex-col items-center gap-12 font-poppins">
         
         {/* HERO SECTION */}
         <section id="home" className="w-full max-w-5xl bg-[#242424] rounded-[40px] shadow-2xl border border-white/5 relative flex flex-col md:flex-row overflow-hidden min-h-[700px] md:min-h-[550px] lg:min-h-[640px]">
            
            {/* The small top circle anchor indicator */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-white/10 items-center justify-center z-20 pointer-events-none hidden lg:flex">
              <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50" />
            </div>

            {/* Physics Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

            {/* LEFT/TOP: Card Wrapper */}
            <div className="w-full md:w-1/2 h-[450px] sm:h-[550px] md:h-[600px] lg:h-[640px] relative pointer-events-none z-20 flex-shrink-0 scale-75 sm:scale-90 md:scale-75 lg:scale-100 origin-top">
              <div 
                ref={cardRef}
                className="absolute top-0 left-0 w-[260px] pointer-events-auto cursor-grab active:cursor-grabbing select-none"
                style={{ transformOrigin: "50% -25px", willChange: "transform" }}
                onPointerDown={startCardDrag}
              >
                 {/* Metal Clip & Ring */}
                 <div className="absolute -top-[25px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                    <div className="w-12 h-5 bg-gradient-to-b from-gray-400 to-gray-600 rounded-sm shadow-md border-b border-gray-700" />
                    <div className="w-6 h-8 border-[4px] border-gray-300 rounded-full -mt-2 shadow-[0_4px_10px_rgba(0,0,0,0.5)]" />
                 </div>

                 {/* The ID Card Base */}
                 <div className="w-full aspect-[2/3] rounded-2xl bg-gradient-to-b from-[#f0f0f0] to-[#d4d4d4] shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-3 relative overflow-hidden flex flex-col border border-white/50">
                    {/* Hole */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-2.5 bg-[#111] rounded-full shadow-inner z-10" />
                    
                    {/* Photo Area */}
                    <div className="w-full flex-1 bg-[#1a1a1a] rounded-xl mt-6 relative overflow-hidden border-[3px] border-black/10">
                       <img src="https://cdn.jsdelivr.net/gh/xiroro-ab/bab3-sk-kelas8v2-aris@main/1752495560972.jpg" alt="Profile" className="w-full h-full object-cover object-top" draggable={false} />
                       <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none" />
                    </div>

                    {/* Bottom Area */}
                    <div className="h-[90px] w-full relative flex items-center justify-center overflow-hidden">
                       <div className="relative z-10">
                          <span className="text-2xl font-black text-black/80 uppercase tracking-tighter text-center leading-none block">Aris<br/>Bermansyah</span>
                       </div>
                    </div>
                    
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-50 pointer-events-none" />
                 </div>
              </div>
            </div>

            {/* RIGHT/BOTTOM: Text Content */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-12 md:px-6 lg:pr-12 lg:pl-0 py-8 md:py-0 relative z-20 pointer-events-auto text-center lg:text-left">
               <h2 className="text-xl sm:text-2xl text-slate-300 mb-2 font-medium">
                 Halo! Saya <span className="font-bold text-white">Aris</span>
               </h2>
               <h1 className="text-3xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight" style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)", wordBreak: "break-word" }}>
                 GURU INFORMATIKA.
               </h1>
               <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
                 Menyukai design, walau tidak paham design. Berbekal antusiasme tinggi untuk terus belajar, mencoba, dan menciptakan karya. Menyelesaikan setiap baris kode dengan insting dan imajinasi. Hanya VIBE CODING.
               </p>
               <div className="flex justify-center lg:justify-start">
                 <a href="#portofolio" className="flex items-center gap-3 px-6 py-3.5 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-xl">
                   Portofolio
                   <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center">
                     <ArrowDown className="w-4 h-4" />
                   </div>
                 </a>
               </div>
            </div>
         </section>

         {/* PORTFOLIO SECTION */}
         <section id="portofolio" className="w-full max-w-5xl mx-auto flex flex-col gap-6">
            <div className="bg-[#242424] rounded-[40px] shadow-2xl border border-white/5 p-8 sm:p-12 text-center lg:text-left">
               <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Portofolio & Project</h2>
               <p className="text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 text-sm sm:text-base">
                 Beberapa project dan karya unggulan yang telah diselesaikan.
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                     { icon: Code, title: "Sistem Management Guru", desc: "Aplikasi manajemen data guru berbasis web yang fungsional. Dibangun murni dari vibe coding.", href: "https://smpn58.vercel.app/" },
                     { icon: Layout, title: "Aplikasi Ujian CBT Online", desc: "Platform Computer Based Test online untuk pelaksanaan ujian yang stabil. Fokus pada fungsi logika inti.", href: "https://xiroro-ab.github.io/ujian-online/" },
                     { icon: Smartphone, title: "Asset Bundle Porter MLBB", desc: "Tools porting asset bundle Unity untuk script MLBB. Berjalan responsif dengan struktur teknis yang kuat.", href: "https://huggingface.co/spaces/xiroro/PortingApp/" },
                     { icon: ExternalLink, title: "Toko Script MLBB", desc: "Toko penjualan online khusus script MLBB. Interface sederhana yang mementingkan pengalaman transaksi cepat.", href: "https://xiroro-ab.github.io/Toko-Online-Script-Mlbb/" }
                  ].map((item, i) => (
                     <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="block bg-[#1c1c1c] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 group">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6 text-white mx-auto lg:mx-0 group-hover:scale-110 transition-transform">
                          <item.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                     </a>
                  ))}
               </div>
            </div>
         </section>

         {/* YOUTUBE SECTION */}
         <section id="youtube" className="w-full max-w-5xl mx-auto flex flex-col gap-6 mb-12">
            <div className="bg-[#242424] rounded-[40px] shadow-2xl border border-white/5 p-8 sm:p-12 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12 overflow-hidden">
               <div className="flex-1">
                 <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Akun YouTube Ku</h2>
                 <p className="text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed">
                   Saya juga aktif membagikan berbagai project, 3D modeling, karya kreatif lainnya, dan eksperimen coding di channel YouTube saya.
                   Jangan lupa mampir, tonton karya-karyanya, dan berikan dukungan Anda dengan subscribe!
                 </p>
                 <a href="https://youtube.com/@Xiroro-3DMODEL" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-red-600/30">
                   Kunjungi Channel
                   <ExternalLink className="w-5 h-5" />
                 </a>
               </div>
               
                                             {/* 3D YouTube Screenshot Mobile Mockup */}
               <div className="w-[260px] sm:w-[320px] flex-shrink-0 flex flex-col group relative z-10"
                    style={{ perspective: "1200px" }}
                >
                  <div className="relative w-full aspect-[9/19.5] transition-transform duration-500 ease-out"
                       style={{
                          transform: "rotateY(-25deg) rotateX(10deg) rotateZ(-2deg) scale(1)",
                          transformStyle: "preserve-3d"
                       }}
                       onMouseEnter={(e) => e.currentTarget.style.transform = "rotateY(0deg) rotateX(0deg) rotateZ(0deg) scale(1.05)"}
                       onMouseLeave={(e) => e.currentTarget.style.transform = "rotateY(-25deg) rotateX(10deg) rotateZ(-2deg) scale(1)"}
                  >
                     {/* 3D Thickness Layers (12 layers to simulate 12px depth) */}
                     {[...Array(12)].map((_, i) => (
                        <div key={i} className="absolute inset-0 bg-slate-300 border border-slate-400 rounded-[45px]" style={{ transform: `translateZ(-${i + 1}px)` }}></div>
                     ))}
                     
                     {/* Deepest layer for Drop Shadow */}
                     <div className="absolute inset-0 bg-slate-400 rounded-[45px]" style={{ transform: 'translateZ(-13px)', boxShadow: '-25px 30px 50px rgba(0,0,0,0.8)' }}></div>

                     {/* Physical Buttons (attached to the sides, pushed slightly back in Z) */}
                     {/* Volume Up */}
                     <div className="absolute top-[20%] -left-[4px] w-[4px] h-[45px] bg-slate-300 rounded-l-md border-y border-l border-slate-400" style={{ transform: 'translateZ(-6px)' }}></div>
                     {/* Volume Down */}
                     <div className="absolute top-[28%] -left-[4px] w-[4px] h-[45px] bg-slate-300 rounded-l-md border-y border-l border-slate-400" style={{ transform: 'translateZ(-6px)' }}></div>
                     {/* Power Button */}
                     <div className="absolute top-[25%] -right-[4px] w-[4px] h-[65px] bg-slate-300 rounded-r-md border-y border-r border-slate-400" style={{ transform: 'translateZ(-6px)' }}></div>

                     {/* Front Face (Screen and Bezel) */}
                     <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 rounded-[45px] p-[3px] sm:p-[4px]" style={{ transform: 'translateZ(0px)', transformStyle: "preserve-3d" }}>
                         {/* Inner Bezel (Black Bkontak) */}
                         <div className="relative w-full h-full bg-[#0a0a0a] rounded-[42px] p-[6px] sm:p-[8px] overflow-hidden flex shadow-[inset_0_0_15px_rgba(0,0,0,1)] border border-black" style={{ transform: 'translateZ(1px)' }}>
                             {/* Dynamic Island / Notch */}
                             <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[32%] h-[24px] bg-black rounded-[20px] z-30 shadow-[inset_0_-1px_3px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2">
                                 {/* Camera lens reflection */}
                                 <div className="w-2.5 h-2.5 rounded-full bg-[#0f0f2a] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.15)] border border-[#1a1a1a]"></div>
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#0f0f2a] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.15)]"></div>
                             </div>
                             
                             {/* Screen Content */}
                             <div className="w-full h-full bg-slate-900 rounded-[34px] overflow-hidden relative z-20">
                                 <img src="https://cdn.jsdelivr.net/gh/xiroro-ab/Toko-Online-Script-Mlbb@main/WhatsApp%20Image%202026-07-15%20at%2023.41.21.jpeg" alt="YouTube Screenshot" className="w-full h-full object-cover object-top" />
                                 
                                 {/* Glossy Screen Reflection */}
                                 <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none z-30" />
                                 {/* Inner Shadow for Screen Depth */}
                                 <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] pointer-events-none z-30 rounded-[34px]" />
                             </div>
                         </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* SOCIAL & CONTACT SECTION */}
         <section id="kontak" className="w-full max-w-5xl mx-auto flex flex-col gap-6 mb-20">
            <div className="bg-[#242424] rounded-[40px] shadow-2xl border border-white/5 p-8 sm:p-12 text-center">
               <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Mari Terhubung</h2>
               <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-sm sm:text-base">
                 Punya ide project seru, butuh script MLBB, atau hanya sekedar ingin berdiskusi? Jangan ragu untuk menghubungi saya melalui kontak di bawah.
               </p>
               
               <div className="flex flex-wrap justify-center gap-4">
                  {[
                     { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/aris.bermansyah/" },
                     { icon: Github, label: "GitHub", href: "https://github.com/xiroro-ab/" },
                     { icon: Mail, label: "Email", href: "mailto:aris.bermansyah14@gmail.com" },
                     { icon: ExternalLink, label: "Website", href: "https://xiroro-ab.github.io/Toko-Online-Script-Mlbb/" }
                  ].map((soc, i) => (
                     <a key={i} href={soc.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 bg-[#1c1c1c] border border-white/5 rounded-full hover:bg-white/10 hover:-translate-y-1 transition-all text-white font-semibold text-sm sm:text-base">
                        <soc.icon className="w-5 h-5" />
                        {soc.label}
                     </a>
                  ))}
               </div>
            </div>
         </section>

      </main>
    </div>
  );
}
