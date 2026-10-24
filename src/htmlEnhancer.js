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
  // Pengendali Universal Tab & Interaktivitas MPI (Rock-Solid Index & ID Auto-Pairing)
  function initMpiTabController() {
    // 1. Temukan semua tombol tab navigasi
    var tabButtons = Array.prototype.slice.call(document.querySelectorAll(
      '.tab-btn, [role="tab"], nav button, [role="tablist"] button, .tab-buttons button, [data-tab]'
    )).filter(function(b) {
      // Pastikan bukan tombol kuis atau tombol dalam panel simulasi
      return !b.closest('.quiz-options, .quiz-card, .sim-controls');
    });

    // 2. Temukan semua panel konten tab
    var tabPanels = Array.prototype.slice.call(document.querySelectorAll(
      '.tab-content, .tab-pane, [role="tabpanel"], [id^="tab-"], [id^="tab_"], [id*="content-"]'
    )).filter(function(p) {
      return !p.matches('button, a, nav, [role="tab"], .tab-btn');
    });

    if (tabPanels.length === 0) {
      // Fallback deteksi panel utama
      tabPanels = Array.prototype.slice.call(document.querySelectorAll('main > div, main > section, .container > div, .container > section')).filter(function(d) {
        return d.id && !d.matches('nav, header, footer, [role="tablist"]');
      });
    }

    function activateTab(index, targetId) {
      var activePanel = null;

      // Cari panel yang cocok dengan ID jika ada
      if (targetId) {
        var cleanId = String(targetId).trim().replace(/^[#]/, '');
        activePanel = document.getElementById(cleanId) ||
                      document.getElementById('tab-' + cleanId) ||
                      document.querySelector('[data-tab-content="' + cleanId + '"]') ||
                      document.querySelector('[data-content="' + cleanId + '"]');
      }

      // Jika tidak ditemukan dengan ID, pasangkan berdasarkan indeks tombol
      if (!activePanel && tabPanels[index]) {
        activePanel = tabPanels[index];
      }

      if (activePanel) {
        tabPanels.forEach(function(p) {
          if (p === activePanel) {
            p.classList.remove('hidden');
            p.style.removeProperty('display');
            p.style.display = 'block';
          } else {
            p.classList.add('hidden');
            p.style.display = 'none';
          }
        });
      }

      // Perbarui tampilan aktif tombol tab
      tabButtons.forEach(function(btn, i) {
        var btnOnclick = btn.getAttribute('onclick') || '';
        var btnDataTab = btn.getAttribute('data-tab') || '';
        var isThis = (activePanel && (btn.id === 'btn-' + activePanel.id || btnDataTab === activePanel.id || btnOnclick.indexOf(activePanel.id) !== -1)) || (i === index);

        if (isThis) {
          btn.classList.add('active', 'border-indigo-600', 'text-indigo-600', 'font-black', 'bg-indigo-50');
          btn.classList.remove('border-transparent', 'text-slate-500');
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.classList.remove('active', 'border-indigo-600', 'text-indigo-600', 'font-black', 'bg-indigo-50');
          btn.classList.add('border-transparent', 'text-slate-500');
          btn.setAttribute('aria-selected', 'false');
        }
      });
    }

    // Pasang direct click listener pada setiap tombol tab
    tabButtons.forEach(function(btn, idx) {
      btn.addEventListener('click', function(e) {
        var onclickStr = btn.getAttribute('onclick') || '';
        var dataTab = btn.getAttribute('data-tab') || '';
        var m = onclickStr.match(/(?:switchTab|showTab|openTab|selectTab|pilihTab|changeTab|setTab)\s*\(\s*['"]?([^'")]+)['"]?\s*\)/i);
        var targetId = dataTab || (m ? m[1] : null);
        activateTab(idx, targetId);
      });
    });

    // Daftarkan fungsi global switchTab, showTab, openTab dsb ke window
    ['switchTab', 'showTab', 'openTab', 'selectTab', 'pilihTab', 'changeTab', 'setTab', 'activateTab'].forEach(function(fn) {
      window[fn] = function(id) {
        var clean = String(id || '').trim().replace(/^[#]/, '');
        var foundIdx = -1;
        tabPanels.forEach(function(p, idx) {
          if (p.id === clean || p.getAttribute('data-tab-content') === clean || p.id === 'tab-' + clean) {
            foundIdx = idx;
          }
        });
        if (foundIdx === -1 && typeof id === 'number') foundIdx = id;
        activateTab(foundIdx >= 0 ? foundIdx : 0, clean);
      };
    });

    // Pastikan tab pertama aktif saat pertama kali dimuat
    if (tabButtons.length > 0 && tabPanels.length > 0) {
      var hasVisible = tabPanels.some(function(p) {
        return !p.classList.contains('hidden') && p.style.display !== 'none';
      });
      if (!hasVisible) {
        activateTab(0, null);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMpiTabController);
  } else {
    initMpiTabController();
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
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
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
