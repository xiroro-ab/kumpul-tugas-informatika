// HTML Sanitizer & Mobile Auto-Healer Shield for Media Pembelajaran Interaktif (MPI)
// Memastikan semua dokumen HTML (baik buatan AI maupun upload guru)
// memiliki meta viewport, Tailwind CSS CDN, dan reset responsif anti pecah di HP siswa.

/**
 * Memastikan dokumen HTML memiliki viewport meta, Tailwind CSS, dan pelindung CSS responsif.
 * @param {string} rawHtml - String HTML mentah
 * @returns {string} String HTML yang telah disempurnakan
 */
export function sanitizeAndEnhanceHtml(rawHtml) {
    if (!rawHtml || typeof rawHtml !== 'string') return '';
    let html = rawHtml.trim();

    // 1. Bersihkan bungkus markdown jika ada (```html ... ```)
    if (html.startsWith('```')) {
        html = html.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim();
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
  }
</style>`;

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
