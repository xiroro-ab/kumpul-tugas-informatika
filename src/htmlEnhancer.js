// HTML Sanitizer & Mobile Auto-Healer Shield for Media Pembelajaran Interaktif (MPI)
// Memastikan semua dokumen HTML (baik buatan AI maupun upload guru)
// memiliki meta viewport, Tailwind CSS CDN, reset responsif anti pecah di HP siswa,
// dan Auto-Healer Universal Tab Controller agar tab interaktif selalu dapat diklik.

/**
 * Memastikan dokumen HTML memiliki viewport meta, Tailwind CSS, pelindung responsif,
 * dan pengendali tab interaktif otomatis yang kebal error closure.
 * @param {string} rawHtml - String HTML mentah
 * @returns {string} String HTML yang telah disempurnakan
 */
export function sanitizeAndEnhanceHtml(rawHtml) {
    if (!rawHtml || typeof rawHtml !== 'string') return '';
    let html = rawHtml.trim();

    // 1. Ekstrak dokumen HTML murni jika dibungkus blok markdown atau percakapan AI
    const codeBlockMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
        html = codeBlockMatch[1].trim();
    } else {
        const docTypeMatch = html.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
        if (docTypeMatch) {
            html = docTypeMatch[1].trim();
        } else {
            const htmlTagMatch = html.match(/(<html[\s\S]*?<\/html>)/i);
            if (htmlTagMatch) {
                html = htmlTagMatch[1].trim();
            }
        }
    }

    const shieldStyle = `
<style id="mpi-mobile-shield">
  /* Auto-Healer & Mobile Shield untuk MPI Siswa */
  *, *::before, *::after {
    box-sizing: border-box !important;
  }
  html, body {
    max-width: 100% !important;
    overflow-x: hidden !important;
    margin: 0;
    padding: 0;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  img, canvas, svg, video, iframe, table {
    max-width: 100% !important;
    height: auto;
  }
  .container, main, section, article {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  button, [role="button"], a.btn, input[type="button"], input[type="submit"] {
    min-height: 44px;
    touch-action: manipulation;
    cursor: pointer;
  }
</style>`;

    const tabAutoHealerScript = `
<script id="mpi-tab-autohealer">
(function() {
  // Pengendali Navigasi Tab Universal & Safety Net (Ultra-Robust)
  // Menjamin seluruh tombol navigasi tab, tombol hamburger, dan tombol kuis selalu merespons saat diklik.

  function getCleanId(val) {
    if (!val) return '';
    var str = String(val).trim().toLowerCase();
    var m = str.match(/(?:switchTab|showSection|openTab|showTab|selectTab)\s*\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    str = m ? m[1] : str;
    return str.replace(/^(?:tab-content-|section-|tab-|btn-)/, '').replace(/^[#]/, '');
  }

  function findTargetElement(id) {
    if (!id) return null;
    var clean = getCleanId(id);
    return document.getElementById('tab-content-' + clean) ||
           document.getElementById('section-' + clean) ||
           document.getElementById('tab-' + clean) ||
           document.getElementById(clean) ||
           document.querySelector('[data-tab-content="' + clean + '"]') ||
           document.querySelector('[data-section="' + clean + '"]') ||
           document.querySelector('[data-tab="' + clean + '"]');
  }

  window.switchTab = function(targetId) {
    var clean = getCleanId(targetId);
    if (!clean) return;

    // 1. Temukan semua panel konten section/tab
    var allPanels = Array.prototype.slice.call(document.querySelectorAll(
      '.mpi-tab-panel, .mpi-section, .tab-content, .page-section, [id^="tab-content-"], [id^="section-"], [id^="tab-"]'
    )).filter(function(p) {
      return !p.matches('button, a, nav, [role="tab"], .mpi-tab-btn, .mpi-nav-btn, .tab-btn');
    });

    var targetEl = findTargetElement(clean);
    if (!targetEl && allPanels.length > 0) {
      for (var i = 0; i < allPanels.length; i++) {
        if (allPanels[i].id && allPanels[i].id.toLowerCase().indexOf(clean) !== -1) {
          targetEl = allPanels[i];
          break;
        }
      }
    }

    if (targetEl) {
      allPanels.forEach(function(panel) {
        if (panel === targetEl) {
          panel.style.display = 'block';
          panel.classList.remove('hidden');
        } else {
          panel.style.display = 'none';
          panel.classList.add('hidden');
        }
      });
    }

    // 2. Perbarui gaya tombol tab aktif
    var allBtns = document.querySelectorAll('.mpi-tab-btn, .mpi-nav-btn, .tab-btn, [role="tab"]');
    allBtns.forEach(function(b) {
      b.classList.remove('active', 'bg-indigo-600', 'text-white');
      b.classList.add('bg-white', 'text-slate-800');
    });

    var activeBtn = document.getElementById('tab-btn-' + clean) ||
                    document.getElementById('btn-' + clean) ||
                    document.getElementById('nav-' + clean) ||
                    document.querySelector('[data-tab="' + clean + '"]') ||
                    document.querySelector('[onclick*="' + clean + '"]');
    if (activeBtn) {
      activeBtn.classList.add('active', 'bg-indigo-600', 'text-white');
      activeBtn.classList.remove('bg-white', 'text-slate-800');
    }

    // 3. Jika sidebar/drawer terbuka di HP, tutup
    var sidebar = document.getElementById('mpi-sidebar') || document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 1024) {
      sidebar.classList.add('hidden', '-translate-x-full');
      sidebar.style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Alias kompatibilitas universal
  window.showSection = window.switchTab;
  window.openTab = window.switchTab;
  window.showTab = window.switchTab;
  window.selectTab = window.switchTab;

  // Handler toggle sidebar/hamburger serbaguna
  window.toggleSidebar = function() {
    var sidebars = document.querySelectorAll('#mpi-sidebar, #sidebar, aside.sidebar, nav.sidebar, [data-sidebar]');
    sidebars.forEach(function(sb) {
      var isHidden = sb.classList.contains('hidden') || sb.classList.contains('-translate-x-full') || sb.style.display === 'none';
      if (isHidden) {
        sb.classList.remove('hidden', '-translate-x-full');
        sb.classList.add('translate-x-0');
        sb.style.display = 'block';
        sb.style.visibility = 'visible';
      } else {
        sb.classList.add('hidden', '-translate-x-full');
        sb.classList.remove('translate-x-0');
        sb.style.display = 'none';
      }
    });
  };
  window.toggleMenu = window.toggleSidebar;
  window.toggleNav = window.toggleSidebar;
  window.openSidebar = window.toggleSidebar;

  // Safety net capture-phase click listener
  // Menjamin klik pada tombol tab atau hamburger LANGSUNG bekerja di tingkat peramban
  document.addEventListener('click', function(e) {
    // 1. Cek tombol menu / hamburger
    var menuBtn = e.target.closest('#hamburger-btn, #menu-btn, .hamburger, [data-toggle="sidebar"], button[onclick*="toggle"]');
    if (menuBtn) {
      window.toggleSidebar();
      return;
    }

    // 2. Cek tombol tab navigasi
    var tabBtn = e.target.closest('.mpi-tab-btn, .mpi-nav-btn, .tab-btn, [data-tab], [data-section], [role="tab"]');
    if (tabBtn) {
      var dataVal = tabBtn.getAttribute('data-tab') || tabBtn.getAttribute('data-section') || '';
      var onclickStr = tabBtn.getAttribute('onclick') || '';
      var targetId = dataVal;
      if (!targetId && onclickStr) {
        var m = onclickStr.match(/(?:switchTab|showSection|openTab|showTab|selectTab)\s*\(\s*['"]?([^'")]+)['"]?\s*\)/i);
        if (m) targetId = m[1];
      }
      if (!targetId && tabBtn.id) {
        targetId = tabBtn.id.replace(/^(?:tab-btn-|btn-|nav-)/, '');
      }
      if (targetId) {
        window.switchTab(targetId);
      }
    }
  }, true);

  // Inisialisasi tab pertama saat halaman siap
  function initFirstTab() {
    var hasActive = document.querySelector('.mpi-tab-panel:not(.hidden), .mpi-section:not(.hidden)');
    if (!hasActive) {
      window.switchTab('beranda');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirstTab);
  } else {
    initFirstTab();
  }
})();
</script>`;

    const interactiveToolkitScript = `
<script id="mpi-interactive-toolkit">
(function() {
  // 1. Audio Synthesizer via Web Audio API (Zero external MP3, 100% offline & instan)
  var audioCtx = null;
  function getAudioContext() {
    try {
      if (!audioCtx) {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    } catch (_) {
      return null;
    }
  }

  window.mpiPlaySound = function(type) {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;

      if (type === 'correct') {
        // Melodi ceria nada naik: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
        var notes = [523.25, 659.25, 783.99];
        notes.forEach(function(freq, i) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.09);
          gain.gain.setValueAtTime(0.18, now + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.09);
          osc.stop(now + i * 0.09 + 0.22);
        });
      } else if (type === 'wrong') {
        // Buzz halus: 280Hz -> 170Hz
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(170, now + 0.22);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.27);
      } else if (type === 'click') {
        // Pop click renyah
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'fanfare' || type === 'cheer') {
        // Fanfare kemenangan: C5 -> E5 -> G5 -> C6
        var fanf = [523.25, 659.25, 783.99, 1046.50];
        fanf.forEach(function(freq, i) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.11);
          gain.gain.setValueAtTime(0.2, now + i * 0.11);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.38);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.11);
          osc.stop(now + i * 0.11 + 0.42);
        });
      }
    } catch (_) {}
  };

  // 2. Confetti Particle Cannon (Pure Canvas, bebas library eksternal)
  window.mpiLaunchConfetti = function() {
    try {
      var canvas = document.getElementById('mpi-confetti-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'mpi-confetti-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999999;';
        document.body.appendChild(canvas);
      }
      var ctx = canvas.getContext('2d');
      var width = canvas.width = window.innerWidth;
      var height = canvas.height = window.innerHeight;

      var pieces = [];
      var colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
      for (var i = 0; i < 85; i++) {
        pieces.push({
          x: width * 0.5 + (Math.random() - 0.5) * 220,
          y: height * 0.35,
          w: Math.random() * 10 + 6,
          h: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.7) * 16 - 4,
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 14,
          opacity: 1
        });
      }

      var start = null;
      function animate(time) {
        if (!start) start = time;
        var progress = time - start;
        ctx.clearRect(0, 0, width, height);

        var alive = false;
        pieces.forEach(function(p) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.38;
          p.vx *= 0.98;
          p.rot += p.rotSpeed;
          if (progress > 1200) {
            p.opacity -= 0.02;
          }
          if (p.opacity > 0 && p.y < height + 50) {
            alive = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
          }
        });

        if (alive && progress < 3000) {
          requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, width, height);
        }
      }
      requestAnimationFrame(animate);
    } catch (_) {}
  };

  // 3. XP & Score Engine
  window.mpiCurrentXp = 0;
  window.mpiAddXp = function(amount) {
    window.mpiCurrentXp = (window.mpiCurrentXp || 0) + Number(amount || 0);
    var xpCounters = document.querySelectorAll('.mpi-xp-counter, [data-xp-counter]');
    xpCounters.forEach(function(el) {
      el.textContent = '⭐ ' + window.mpiCurrentXp + ' XP';
      el.classList.add('scale-110');
      setTimeout(function() { el.classList.remove('scale-110'); }, 250);
    });
    var xpBars = document.querySelectorAll('.mpi-xp-bar, [data-xp-bar]');
    xpBars.forEach(function(bar) {
      var max = Number(bar.getAttribute('data-xp-max') || 100);
      var pct = Math.min(100, Math.round((window.mpiCurrentXp / max) * 100));
      bar.style.width = pct + '%';
    });
  };

  // 4. Delegasi klik: bunyi klik pop otomatis pada tombol yang belum memiliki suara
  document.addEventListener('click', function(e) {
    try {
      var btn = e.target.closest('button, [role="tab"], .tab-btn, .interactive-btn');
      if (btn && !btn.hasAttribute('data-no-sound')) {
        var onclickStr = btn.getAttribute('onclick') || '';
        if (onclickStr.indexOf('mpiPlaySound') === -1) {
          window.mpiPlaySound('click');
        }
      }
    } catch (_) {}
  });
})();
</script>`;

    const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">';
    const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>';

    const hasHtmlTag = /<html[\s>]/i.test(html);
    const hasHeadTag = /<head[\s>]/i.test(html);
    const hasBodyTag = /<body[\s>]/i.test(html);

    // Jika hanya potongan HTML tanpa <html> atau <body>, bungkus jadi dokumen utuh
    if (!hasHtmlTag && !hasBodyTag) {
        return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  ${viewportMeta}
  ${tailwindScript}
  ${shieldStyle}
</head>
<body class="bg-slate-50 text-slate-800 p-4 md:p-6 min-h-screen">
  ${html}
  ${tabAutoHealerScript}
  ${interactiveToolkitScript}
</body>
</html>`;
    }

    // Sisipkan viewport jika belum ada
    if (!/<meta[^>]*viewport/i.test(html)) {
        if (hasHeadTag) {
            html = html.replace(/<head([\s>])/i, `<head$1\n  ${viewportMeta}\n`);
        } else if (hasHtmlTag) {
            html = html.replace(/<html([\s>])/i, `<html$1\n<head>\n  ${viewportMeta}\n</head>\n`);
        }
    }

    // Sisipkan Tailwind CSS CDN jika belum ada
    if (!/cdn\.tailwindcss\.com/i.test(html)) {
        if (hasHeadTag) {
            html = html.replace(/<\/head>/i, `  ${tailwindScript}\n</head>`);
        } else if (hasBodyTag) {
            html = html.replace(/<body([\s>])/i, `<head>${tailwindScript}</head>\n<body$1`);
        }
    }

    // Sisipkan Mobile Shield CSS jika belum ada
    if (!html.includes('id="mpi-mobile-shield"')) {
        if (hasHeadTag) {
            html = html.replace(/<\/head>/i, `${shieldStyle}\n</head>`);
        } else if (hasBodyTag) {
            html = html.replace(/<body([\s>])/i, `${shieldStyle}\n<body$1`);
        } else {
            html = shieldStyle + '\n' + html;
        }
    }

    // Sisipkan Auto-Healer Tab Controller jika belum ada
    if (!html.includes('id="mpi-tab-autohealer"')) {
        if (hasBodyTag) {
            html = html.replace(/<\/body>/i, `${tabAutoHealerScript}\n</body>`);
        } else if (hasHtmlTag) {
            html = html.replace(/<\/html>/i, `${tabAutoHealerScript}\n</html>`);
        } else {
            html = html + '\n' + tabAutoHealerScript;
        }
    }

    // Sisipkan MPI Interactive Toolkit (Audio Synthesizer, Confetti, XP Tracker) jika belum ada
    if (!html.includes('id="mpi-interactive-toolkit"')) {
        if (hasBodyTag) {
            html = html.replace(/<\/body>/i, `${interactiveToolkitScript}\n</body>`);
        } else if (hasHtmlTag) {
            html = html.replace(/<\/html>/i, `${interactiveToolkitScript}\n</html>`);
        } else {
            html = html + '\n' + interactiveToolkitScript;
        }
    }

    return html;
}

/**
 * Membuka konten HTML di tab peramban baru via Object URL Blob
 * @param {string} htmlContent - Konten HTML
 * @param {string} title - Judul materi
 */
export function openHtmlInNewTab(htmlContent, title = 'Media Pembelajaran') {
    const fullHtml = sanitizeAndEnhanceHtml(htmlContent);
    const win = window.open('', '_blank');
    if (win) {
        try {
            win.document.open();
            win.document.write(fullHtml);
            win.document.close();
            return;
        } catch (_) {}
    }
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const fallbackWin = window.open(url, '_blank');
    if (!fallbackWin) {
        alert('Popup diblokir oleh peramban. Harap izinkan pop-up untuk melihat materi di tab baru.');
    }
}

/**
 * Mengunduh dokumen HTML mandiri ke penyimpanan lokal komputer guru
 * @param {string} htmlContent - Konten HTML
 * @param {string} fileName - Nama file unduhan (.html)
 */
export function downloadHtmlFile(htmlContent, fileName = 'materi-interaktif.html') {
    const fullHtml = sanitizeAndEnhanceHtml(htmlContent);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (fileName || 'materi-interaktif')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_');
    a.download = safeName.endsWith('.html') ? safeName : `${safeName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 15000);
}

/**
 * Membersihkan skrip dan style pelindung yang disisipkan agar kode bersih saat dikirim ke AI
 * @param {string} html - HTML lengkap
 * @returns {string} HTML murni tanpa injeksi internal
 */
export function stripInjectedEnhancements(html) {
    if (!html || typeof html !== 'string') return '';
    return html
        .replace(/<style id="mpi-mobile-shield">[\s\S]*?<\/style>/gi, '')
        .replace(/<script id="mpi-tab-autohealer">[\s\S]*?<\/script>/gi, '')
        .replace(/<script id="mpi-interactive-toolkit">[\s\S]*?<\/script>/gi, '')
        .trim();
}
