// HTML Sanitizer & Exporter for Media Pembelajaran Interaktif (MPI)
// Mengikuti standar murni mandiri (zero dependencies) dari generator RPM website siswa.

/**
 * Membersihkan kode HTML hasil generate AI dari pembungkus markdown
 * dan memastikan meta viewport standar tersedia agar nyaman di layar HP dan laptop.
 * @param {string} rawHtml - String HTML mentah dari AI
 * @returns {string} String HTML bersih mandiri
 */
export function sanitizeAndEnhanceHtml(rawHtml) {
    if (!rawHtml || typeof rawHtml !== 'string') return '';
    let html = rawHtml.trim();

    // 1. Ekstrak dokumen HTML jika terbungkus blok markdown (```html ... ```)
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

    // 2. Bersihkan penanda selesai jika ada
    html = html.replace(/<div id="SELESAI"[^>]*><\/div>/gi, '').trim();

    // 3. Pastikan meta viewport tersedia agar tidak pecah di HP
    const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">';
    if (!/<meta[^>]*viewport/i.test(html)) {
        if (/<head[\s>]/i.test(html)) {
            html = html.replace(/<head([\s>])/i, `<head$1\n  ${viewportMeta}\n`);
        } else if (/<html[\s>]/i.test(html)) {
            html = html.replace(/<html([\s>])/i, `<html$1\n<head>\n  ${viewportMeta}\n</head>\n`);
        }
    }

    return html;
}

/**
 * Membuka konten HTML di tab peramban baru secara native
 * Menggunakan document.write persis seperti pada modul generator website RPM
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
 * Mengunduh dokumen HTML mandiri ke komputer guru
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
 * Membersihkan skrip dan style pelindung lama jika ada
 * @param {string} html - HTML lengkap
 * @returns {string} HTML murni bersih
 */
export function stripInjectedEnhancements(html) {
    if (!html || typeof html !== 'string') return '';
    return html
        .replace(/<style id="mpi-mobile-shield">[\s\S]*?<\/style>/gi, '')
        .replace(/<script id="mpi-tab-autohealer">[\s\S]*?<\/script>/gi, '')
        .replace(/<script id="mpi-interactive-toolkit">[\s\S]*?<\/script>/gi, '')
        .replace(/<div id="SELESAI"[^>]*><\/div>/gi, '')
        .trim();
}
