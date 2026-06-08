/**
 * Hello Work ID - CV ATS Optimizer
 * Vanilla JavaScript implementation
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
const state = {
    file: null,
    fileBase64: null,
    jobDescription: '',
    isProcessing: false,
    isDownloadingPdf: false,
    result: null, // Holds the parsed JSON response from backend
};

// ============================================================================
// DOM CACHING
// ============================================================================
const dom = {
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('cv-file-input'),
    uploadIcon: document.getElementById('upload-icon'),
    uploadTitle: document.getElementById('upload-title'),
    filePreview: document.getElementById('optimizer-file-preview'),
    fileName: document.getElementById('optimizer-file-name'),
    btnRemoveFile: document.getElementById('btn-remove-file'),
    jobDescInput: document.getElementById('job-desc-input'),
    btnOptimize: document.getElementById('btn-optimize'),

    emptyState: document.getElementById('result-empty-state'),
    loadingState: document.getElementById('result-loading-state'),
    contentPanel: document.getElementById('result-content-panel'),

    scoreBeforeText: document.getElementById('score-before-text'),
    scoreBeforeBar: document.getElementById('score-before-bar'),
    scoreAfterText: document.getElementById('score-after-text'),
    scoreAfterBar: document.getElementById('score-after-bar'),

    btnDownloadDocx: document.getElementById('btn-download-docx'),
    btnDownloadPdf: document.getElementById('btn-download-pdf'),
    resumeRenderArea: document.getElementById('resume-render-area'),
    listKeyChanges: document.getElementById('list-key-changes'),
    listTips: document.getElementById('list-tips'),
    toastContainer: document.getElementById('toast-container'),
};

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 w-full p-4 rounded-xl shadow-lg border transform translate-y-2 opacity-0 transition-all duration-300 ${
        type === 'error'
            ? 'bg-rose-50 border-rose-100 text-rose-800'
            : 'bg-teal-50 border-teal-100 text-teal-800'
    }`;
    
    const icon = type === 'error' ? '❌' : '✅';
    
    toast.innerHTML = `
        <span class="text-lg flex-shrink-0">${icon}</span>
        <div class="text-xs font-semibold flex-1">${message}</div>
        <button class="text-slate-400 hover:text-slate-600 font-bold text-sm px-1 cursor-pointer">&times;</button>
    `;

    // Close button click handler
    toast.querySelector('button').addEventListener('click', () => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    });

    dom.toastContainer.appendChild(toast);

    // Trigger animate-in
    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    }, 10);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ============================================================================
// FILE VALIDATION AND BASE64 CONVERSION
// ============================================================================
const MAX_FILE_SIZE_MB = 3.5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function processFile(file) {
    if (!file) return;

    if (file.type !== 'application/pdf') {
        showToast('Tipe berkas tidak valid! Hanya mendukung file PDF.', 'error');
        clearFileInput();
        return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast(`Ukuran berkas melebihi batas maksimum! Maksimal ${MAX_FILE_SIZE_MB} MB.`, 'error');
        clearFileInput();
        return;
    }

    state.file = file;
    dom.fileName.textContent = file.name;
    dom.filePreview.classList.remove('hidden');
    dom.filePreview.classList.add('flex');
    dom.dropZone.classList.add('hidden');

    // Convert file to Base64
    const reader = new FileReader();
    reader.onload = function (e) {
        state.fileBase64 = e.target.result.split(',')[1];
        validateForm();
    };
    reader.onerror = function () {
        showToast('Gagal membaca file PDF.', 'error');
        removeUploadedFile();
    };
    reader.readAsDataURL(file);
}

function removeUploadedFile() {
    state.file = null;
    state.fileBase64 = null;
    clearFileInput();
    validateForm();
}

function clearFileInput() {
    dom.fileInput.value = '';
    dom.filePreview.classList.add('hidden');
    dom.filePreview.classList.remove('flex');
    dom.dropZone.classList.remove('hidden');
}

function validateForm() {
    dom.btnOptimize.disabled = !state.fileBase64 || state.isProcessing;
}

// ============================================================================
// MARKDOWN FORMATTER
// ============================================================================
function formatMarkdown(text) {
    if (!text) return '';

    // Escape HTML to prevent XSS (allowing standard formatting tags if constructed by app)
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;span&gt;/g, '<span>')
        .replace(/&lt;\/span&gt;/g, '</span>');

    // Convert Markdown Headers
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-extrabold text-slate-900 border-b border-slate-200 pb-2 mb-4 mt-6">$1</h1>');
    html = html.replace(/^##title## (.*?)$/gm, '<div class="job-title-header text-center text-lg font-bold text-slate-700 -mt-2 mb-2">$1</div>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold text-slate-800 pb-1 mb-3 mt-5">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-base font-semibold text-slate-700 mb-1.5 mt-3">$1</h3>');

    // Bold text (**bold**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');

    // Italic text (*italic*)
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Bullet list processing
    const lines = html.split('\n');
    let inList = false;
    const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listContent = trimmed.substring(2);
            let result = '';
            if (!inList) {
                result += '<ul class="list-disc pl-5 mb-4 text-sm text-slate-700 flex flex-col gap-1.5">';
                inList = true;
            }
            result += `<li>${listContent}</li>`;
            return result;
        } else {
            let result = '';
            if (inList) {
                result += '</ul>';
                inList = false;
            }
            result += line;
            return result;
        }
    });

    if (inList) {
        formattedLines.push('</ul>');
    }

    // Paragraph wrapping for loose lines (exclude headers and lists)
    return formattedLines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<div class="h-2"></div>'; // Empty lines are spacers
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul') || trimmed.startsWith('<div')) {
            return line;
        }
        return `<p class="text-sm text-slate-600 leading-relaxed mb-3">${line}</p>`;
    }).join('\n');
}

// Convert markdown to super clean HTML specific for PDF generation (strictly ATS standard fonts/margins)
function convertMarkdownToCleanPrintHtml(text) {
    if (!text) return '';

    // Standard markdown parsing with clean design (no Tailwind styles since it is loaded in standard rendering environments)
    let bodyHtml = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;span&gt;/g, '<span>')
        .replace(/&lt;\/span&gt;/g, '</span>');

    // Header conversions
    bodyHtml = bodyHtml.replace(/^# (.*?)$/gm, '<h1 class="name">$1</h1>');
    bodyHtml = bodyHtml.replace(/^##title## (.*?)$/gm, '<div class="job-title" style="text-align: center; font-size: 13pt; font-weight: bold; color: #111111; margin-bottom: 6px;">$1</div>');
    bodyHtml = bodyHtml.replace(/^## (.*?)$/gm, '<h2 class="section-title">$1</h2>');
    bodyHtml = bodyHtml.replace(/^### (.*?)$/gm, '<h3 class="entry-title">$1</h3>');

    // Bold/Italic
    bodyHtml = bodyHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    bodyHtml = bodyHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bullet points
    const lines = bodyHtml.split('\n');
    let inList = false;
    const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listContent = trimmed.substring(2);
            let result = '';
            if (!inList) {
                result += '<ul>';
                inList = true;
            }
            result += `<li>${listContent}</li>`;
            return result;
        } else {
            let result = '';
            if (inList) {
                result += '</ul>';
                inList = false;
            }
            result += line;
            return result;
        }
    });

    if (inList) {
        formattedLines.push('</ul>');
    }

    const compiledHtml = formattedLines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul') || trimmed.startsWith('<strong') || trimmed.startsWith('<em') || trimmed.startsWith('<div')) {
            return line;
        }
        return `<p>${line}</p>`;
    }).join('\n');

    // Add basic clean inline CSS for ATS layout (Single column, standard font, 1 inch margins)
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>CV ATS Optimized</title>
        <style>
            * {
                box-sizing: border-box;
            }
            body {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 10.5pt;
                line-height: 1.4;
                color: #000000;
                margin: 0;
                padding: 0;
                background-color: #ffffff;
            }
            .cv-container {
                width: 100%;
                margin: 0;
                padding: 0;
                overflow-wrap: break-word;
                word-wrap: break-word;
            }
            h1.name {
                font-size: 18pt;
                text-align: center;
                text-transform: uppercase;
                margin-top: 0;
                margin-bottom: 5px;
                font-weight: bold;
                letter-spacing: 0.5px;
            }
            p {
                margin: 0 0 8px 0;
                text-align: left;
            }
            /* Clean contact info block usually below name */
            .cv-container > p:first-of-type,
            .cv-container > p:nth-of-type(2) {
                text-align: center;
                font-size: 9.5pt;
                color: #333333;
                margin-bottom: 12px;
            }
            h2.section-title {
                font-size: 12pt;
                text-transform: uppercase;
                border-bottom: 1px solid #111111;
                margin-top: 20px;
                margin-bottom: 10px;
                padding-bottom: 2px;
                font-weight: bold;
                letter-spacing: 0.5px;
            }
            h3.entry-title {
                font-size: 10.5pt;
                margin-top: 10px;
                margin-bottom: 4px;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
            }
            ul {
                margin: 0 0 10px 0;
                padding-left: 20px;
            }
            li {
                margin-bottom: 4px;
                text-align: left;
            }
            em {
                font-style: italic;
            }
            strong {
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="cv-container">
            ${compiledHtml}
        </div>
    </body>
    </html>
    `;
}

// ============================================================================
// FORM SUBMISSION (OPTIMIZE FLOW)
// ============================================================================
async function runCvOptimization() {
    if (!state.fileBase64 || state.isProcessing) return;

    state.isProcessing = true;
    validateForm();

    // Reset result views
    dom.emptyState.classList.add('hidden');
    dom.contentPanel.classList.add('hidden');
    dom.loadingState.classList.remove('hidden');
    dom.loadingState.classList.add('flex');

    state.jobDescription = dom.jobDescInput.value.trim();
    const selectedLang = document.querySelector('input[name="language-toggle"]:checked').value;

    try {
        const response = await fetch('/api/cv-optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cvBase64: state.fileBase64,
                jobDescription: state.jobDescription,
                language: selectedLang
            })
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const errMsg = errJson.error?.message || 'Terjadi kesalahan pada server proxy.';
            throw new Error(errMsg);
        }

        const data = await response.json();
        
        // Validate required keys from API response
        if (data.atsScoreBefore === undefined || data.atsScoreAfter === undefined || !data.optimizedCV) {
            throw new Error('Format hasil optimasi AI tidak lengkap.');
        }

        state.result = data;
        renderResults();
        showToast('CV Anda berhasil dioptimasi menjadi ramah ATS!');

    } catch (error) {
        console.error('❌ Proxy API Error:', error);
        dom.emptyState.classList.remove('hidden');
        dom.loadingState.classList.add('hidden');
        dom.loadingState.classList.remove('flex');
        
        showToast(`Gagal mengoptimasi CV: ${error.message}`, 'error');
    } finally {
        state.isProcessing = false;
        validateForm();
    }
}

function renderResults() {
    const { atsScoreBefore, atsScoreAfter, optimizedCV, keyChanges, tips } = state.result;

    // Toggle Panels
    dom.loadingState.classList.add('hidden');
    dom.loadingState.classList.remove('flex');
    dom.contentPanel.classList.remove('hidden');

    // Update Score Numbers
    dom.scoreBeforeText.textContent = `${atsScoreBefore}%`;
    dom.scoreAfterText.textContent = `${atsScoreAfter}%`;

    // Animate Score Bars (need small delay to trigger transitions)
    dom.scoreBeforeBar.style.width = '0%';
    dom.scoreAfterBar.style.width = '0%';
    
    // Set color based on score tier
    setScoreColorClass(dom.scoreBeforeBar, atsScoreBefore);
    setScoreColorClass(dom.scoreAfterBar, atsScoreAfter);

    setTimeout(() => {
        dom.scoreBeforeBar.style.width = `${atsScoreBefore}%`;
        dom.scoreAfterBar.style.width = `${atsScoreAfter}%`;
    }, 100);

    // Render Optimized Resume
    dom.resumeRenderArea.innerHTML = formatMarkdown(optimizedCV);

    // Render Key Changes
    dom.listKeyChanges.innerHTML = '';
    if (keyChanges && keyChanges.length > 0) {
        keyChanges.forEach(change => {
            const li = document.createElement('li');
            li.textContent = change;
            dom.listKeyChanges.appendChild(li);
        });
    } else {
        dom.listKeyChanges.innerHTML = '<li class="list-none text-slate-400 italic">Tidak ada catatan perubahan</li>';
    }

    // Render Tips
    dom.listTips.innerHTML = '';
    if (tips && tips.length > 0) {
        tips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            dom.listTips.appendChild(li);
        });
    } else {
        dom.listTips.innerHTML = '<li class="list-none text-slate-400 italic">Tidak ada tips tambahan</li>';
    }
}

function setScoreColorClass(element, score) {
    // Reset background color classes
    element.classList.remove('bg-rose-500', 'bg-amber-500', 'bg-teal-500');
    if (score < 50) {
        element.classList.add('bg-rose-500');
    } else if (score < 80) {
        element.classList.add('bg-amber-500');
    } else {
        element.classList.add('bg-teal-500');
    }
}

// ============================================================================
// EXPORTS & DOWNLOAD DOCX
// ============================================================================

/**
 * Convert optimized CV markdown text to Word-compatible HTML with inline styles.
 * Word's HTML renderer poorly handles CSS classes/selectors, so every element
 * gets explicit inline styling to guarantee consistent Arial font and layout.
 */
function convertMarkdownToWordHtml(text) {
    if (!text) return '';

    // Escape HTML entities
    let content = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;span&gt;/g, '<span>')
        .replace(/&lt;\/span&gt;/g, '</span>');

    // Bold (**text**)
    content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Italic (*text*)
    content = content.replace(/\*(.*?)\*/g, '<i>$1</i>');

    const lines = content.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            // Close any open list before adding empty line
            if (inList) {
                html += '</ul>\n';
                inList = false;
            }
            continue;
        }

        // H1 - Name (centered, uppercase, 18pt)
        if (trimmed.startsWith('# ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            const heading = trimmed.substring(2);
            html += `<h1 style="font-family:Arial,Helvetica,sans-serif; font-size:18pt; text-align:center; text-transform:uppercase; margin:0 0 5px 0; font-weight:bold; letter-spacing:0.5px;">${heading}</h1>\n`;
            continue;
        }

        // ##title## - Job Title (centered, slightly larger, e.g. 13pt)
        if (trimmed.startsWith('##title## ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            const titleText = trimmed.substring(10);
            html += `<p style="font-family:Arial,Helvetica,sans-serif; font-size:13pt; font-weight:bold; text-align:center; margin:0 0 6px 0;">${titleText}</p>\n`;
            continue;
        }

        // H2 - Section title (uppercase, 12pt, underline border)
        if (trimmed.startsWith('## ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            const heading = trimmed.substring(3);
            html += `<h2 style="font-family:Arial,Helvetica,sans-serif; font-size:12pt; text-transform:uppercase; border-bottom:1px solid #111111; margin:20px 0 10px 0; padding-bottom:2px; font-weight:bold; letter-spacing:0.5px;">${heading}</h2>\n`;
            continue;
        }

        // H3 - Entry title (bold, 10.5pt)
        if (trimmed.startsWith('### ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            let headingText = trimmed.substring(4);
            
            // Clean up spans if any for clean DOC layout
            headingText = headingText.replace(/<\/span>\s*<span>/g, ' — ');
            headingText = headingText.replace(/<\/?span[^>]*>/g, '');
            
            html += `<h3 style="font-family:Arial,Helvetica,sans-serif; font-size:10.5pt; margin:10px 0 4px 0; font-weight:bold;">${headingText}</h3>\n`;
            continue;
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listContent = trimmed.substring(2);
            if (!inList) {
                html += '<ul style="margin:0 0 10px 0; padding-left:20px;">\n';
                inList = true;
            }
            html += `<li style="font-family:Arial,Helvetica,sans-serif; font-size:10.5pt; line-height:1.4; margin-bottom:4px; text-align:left;">${listContent}</li>\n`;
            continue;
        }

        // Regular paragraph
        if (inList) { html += '</ul>\n'; inList = false; }
        html += `<p style="font-family:Arial,Helvetica,sans-serif; font-size:10.5pt; line-height:1.4; margin:0 0 8px 0; text-align:left;">${trimmed}</p>\n`;
    }

    // Close any remaining open list
    if (inList) {
        html += '</ul>\n';
    }

    return html;
}

function downloadDocx() {
    if (!state.result || !state.result.optimizedCV) return;

    try {
        const bodyContent = convertMarkdownToWordHtml(state.result.optimizedCV);

        const docContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page {
            size: A4;
            margin: 2.54cm 2.54cm 2.54cm 2.54cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10.5pt;
            line-height: 1.4;
            color: #000000;
            margin: 0;
            padding: 0;
        }
        /* Fallback selectors in case inline styles are stripped */
        h1, h2, h3, p, li, ul, ol, b, i, em, strong, span, div, td, th {
            font-family: Arial, Helvetica, sans-serif !important;
        }
    </style>
</head>
<body style="font-family:Arial,Helvetica,sans-serif; font-size:10.5pt; line-height:1.4; color:#000000;">
${bodyContent}
</body>
</html>`;

        const blob = new Blob(['\ufeff' + docContent], {
            type: 'application/msword'
        });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `CV_ATS_Optimized_${state.file ? state.file.name.replace('.pdf', '') : 'Resume'}.doc`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(downloadUrl);
        a.remove();

        showToast('File DOCX berhasil diunduh! Buka dengan Microsoft Word untuk mengedit.');
    } catch (err) {
        console.error('❌ DOCX Download Error:', err);
        showToast('Gagal mengunduh file DOCX.', 'error');
    }
}

async function downloadPdf() {
    if (!state.result || !state.result.optimizedCV || state.isDownloadingPdf) return;

    state.isDownloadingPdf = true;
    dom.btnDownloadPdf.disabled = true;
    const originalText = dom.btnDownloadPdf.innerHTML;
    dom.btnDownloadPdf.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> Memproses PDF...
    `;

    showToast('Sedang merender dan membuat berkas PDF Anda...');

    try {
        const printHtml = convertMarkdownToCleanPrintHtml(state.result.optimizedCV);

        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                htmlContent: printHtml
            })
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const errMsg = errJson.error?.message || 'Gagal menghasilkan PDF dari backend.';
            throw new Error(errMsg);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `CV_ATS_Optimized_${state.file ? state.file.name.replace('.pdf', '') : 'Resume'}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
        showToast('PDF berhasil diunduh!');

    } catch (error) {
        console.error('❌ PDF Download Error:', error);
        showToast(`Gagal mengunduh PDF: ${error.message}`, 'error');
    } finally {
        state.isDownloadingPdf = false;
        dom.btnDownloadPdf.disabled = false;
        dom.btnDownloadPdf.innerHTML = originalText;
    }
}

// ============================================================================
// EVENT LISTENERS Setup
// ============================================================================
function setupEventListeners() {
    // Click drop-zone trigger
    dom.dropZone.addEventListener('click', () => dom.fileInput.click());

    // File input change
    dom.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        processFile(file);
    });

    // Remove file button
    dom.btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering drop-zone click
        removeUploadedFile();
    });

    // Drag & drop handlers
    dom.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropZone.classList.add('border-teal-500', 'bg-teal-50/30');
    });

    dom.dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dom.dropZone.classList.remove('border-teal-500', 'bg-teal-50/30');
    });

    dom.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.dropZone.classList.remove('border-teal-500', 'bg-teal-50/30');
        const file = e.dataTransfer.files[0];
        processFile(file);
    });

    // Run optimize button click
    dom.btnOptimize.addEventListener('click', runCvOptimization);

    // Download DOCX
    dom.btnDownloadDocx.addEventListener('click', downloadDocx);

    // Download PDF
    dom.btnDownloadPdf.addEventListener('click', downloadPdf);
}

// Initialize setup
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    console.log('✅ CV Optimizer initialized');
});
