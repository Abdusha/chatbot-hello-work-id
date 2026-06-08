/**
 * Hello Work ID - CV ATS Manual Builder
 * Vanilla JavaScript implementation
 */

// ============================================================================
// STATE & DEFAULT DATA
// ============================================================================
const defaultState = {
    personal: {
        fullname: '',
        jobtitle: '',
        email: '',
        phone: '',
        linkedin: '',
        location: ''
    },
    profile: '',
    experiences: [],
    educationList: [],
    skills: '',
    isDownloadingPdf: false
};

let state = JSON.parse(JSON.stringify(defaultState));

// ============================================================================
// DOM ELEMENTS
// ============================================================================
const dom = {
    fullname: document.getElementById('input-fullname'),
    jobtitle: document.getElementById('input-jobtitle'),
    email: document.getElementById('input-email'),
    phone: document.getElementById('input-phone'),
    linkedin: document.getElementById('input-linkedin'),
    location: document.getElementById('input-location'),
    profile: document.getElementById('input-profile'),
    skills: document.getElementById('input-skills'),
    
    experienceContainer: document.getElementById('experience-container'),
    educationContainer: document.getElementById('education-container'),
    
    btnAddExperience: document.getElementById('btn-add-experience'),
    btnAddEducation: document.getElementById('btn-add-education'),
    btnResetForm: document.getElementById('btn-reset-form'),
    
    btnDownloadDocx: document.getElementById('btn-download-docx'),
    btnDownloadPdf: document.getElementById('btn-download-pdf'),
    resumeRenderArea: document.getElementById('resume-render-area'),
    toastContainer: document.getElementById('toast-container')
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

    toast.querySelector('button').addEventListener('click', () => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    });

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    }, 10);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ============================================================================
// LOCAL STORAGE PERSISTENCE
// ============================================================================
const STORAGE_KEY = 'hello_work_manual_cv';

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        personal: state.personal,
        profile: state.profile,
        experiences: state.experiences,
        educationList: state.educationList,
        skills: state.skills
    }));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.personal = data.personal || defaultState.personal;
            state.profile = data.profile || defaultState.profile;
            state.experiences = data.experiences || defaultState.experiences;
            state.educationList = data.educationList || defaultState.educationList;
            state.skills = data.skills || defaultState.skills;
        } catch (e) {
            console.error('Failed to parse saved CV state', e);
        }
    }
}

// ============================================================================
// MARKDOWN RENDERING (Consistent with CV Optimizer)
// ============================================================================
function formatMarkdown(text) {
    if (!text) return '';

    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;span&gt;/g, '<span>')
        .replace(/&lt;\/span&gt;/g, '</span>');

    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-extrabold text-slate-900 border-b border-slate-200 pb-2 mb-4 mt-6">$1</h1>');
    html = html.replace(/^##title## (.*?)$/gm, '<div class="job-title-header text-center text-lg font-bold text-slate-700 -mt-2 mb-2">$1</div>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold text-slate-800 pb-1 mb-3 mt-5">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-base font-semibold text-slate-700 mb-1.5 mt-3">$1</h3>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

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

    return formattedLines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<div class="h-2"></div>';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul') || trimmed.startsWith('<div')) {
            return line;
        }
        return `<p class="text-sm text-slate-600 leading-relaxed mb-3">${line}</p>`;
    }).join('\n');
}

// Convert markdown to clean print HTML (Strictly ATS standard font/layout)
function convertMarkdownToCleanPrintHtml(text) {
    if (!text) return '';

    let bodyHtml = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;span&gt;/g, '<span>')
        .replace(/&lt;\/span&gt;/g, '</span>');

    bodyHtml = bodyHtml.replace(/^# (.*?)$/gm, '<h1 class="name">$1</h1>');
    bodyHtml = bodyHtml.replace(/^##title## (.*?)$/gm, '<div class="job-title" style="text-align: center; font-size: 13pt; font-weight: bold; color: #111111; margin-bottom: 6px;">$1</div>');
    bodyHtml = bodyHtml.replace(/^## (.*?)$/gm, '<h2 class="section-title">$1</h2>');
    bodyHtml = bodyHtml.replace(/^### (.*?)$/gm, '<h3 class="entry-title">$1</h3>');

    bodyHtml = bodyHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    bodyHtml = bodyHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');

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

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>CV ATS Manual</title>
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
// GENERATING MARKDOWN FROM FORM STATE
// ============================================================================
function generateCvMarkdown() {
    let md = '';
    
    // Name H1
    if (state.personal.fullname) {
        md += `# ${state.personal.fullname}\n\n`;
    }
    
    // Job Title (placed directly after name)
    if (state.personal.jobtitle) {
        md += `##title## ${state.personal.jobtitle}\n\n`;
    }
    
    // Contact Info Line
    const contactParts = [];
    if (state.personal.email) contactParts.push(state.personal.email);
    if (state.personal.phone) contactParts.push(state.personal.phone);
    if (state.personal.linkedin) contactParts.push(state.personal.linkedin);
    if (state.personal.location) contactParts.push(state.personal.location);
    
    if (contactParts.length > 0) {
        md += `${contactParts.join(' | ')}\n\n`;
    }
    
    // Ringkasan
    if (state.profile) {
        md += `## Ringkasan\n${state.profile}\n\n`;
    }
    
    // Experiences
    if (state.experiences.length > 0) {
        md += `## Pengalaman Kerja\n`;
        state.experiences.forEach(exp => {
            const company = exp.company || 'Nama Perusahaan';
            const role = exp.role || 'Jabatan';
            const period = exp.period || 'Periode Kerja';
            
            // To separate left side and right side in CSS flex layout, we can use span in H3
            md += `### <span>${company} – ${role}</span> <span>${period}</span>\n`;
            
            if (exp.description) {
                const lines = exp.description.split('\n');
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed) {
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                            md += `${trimmed}\n`;
                        } else {
                            md += `- ${trimmed}\n`;
                        }
                    }
                });
            }
            md += `\n`;
        });
    }
    
    // Education
    if (state.educationList.length > 0) {
        md += `## Pendidikan\n`;
        state.educationList.forEach(edu => {
            const school = edu.school || 'Nama Institusi';
            const degree = edu.degree || 'Gelar / Jurusan';
            const period = edu.period || 'Tahun';
            
            md += `### <span>${school} – ${degree}</span> <span>${period}</span>\n`;
            
            if (edu.description) {
                const lines = edu.description.split('\n');
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed) {
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                            md += `${trimmed}\n`;
                        } else {
                            md += `- ${trimmed}\n`;
                        }
                    }
                });
            }
            md += `\n`;
        });
    }
    
    // Skills
    if (state.skills) {
        md += `## Keahlian\n`;
        // Split by commas, trim, and make sure it has bullet list style or flat line
        const skillList = state.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (skillList.length > 0) {
            md += skillList.map(s => `- ${s}`).join('\n') + '\n';
        }
    }
    
    return md;
}

// ============================================================================
// DOM RENDERING & SYNCING
// ============================================================================
function isStateEmpty() {
    const p = state.personal;
    const hasPersonal = p.fullname || p.jobtitle || p.email || p.phone || p.linkedin || p.location;
    const hasProfile = state.profile && state.profile.trim();
    const hasExperiences = state.experiences.length > 0;
    const hasEducation = state.educationList.length > 0;
    const hasSkills = state.skills && state.skills.trim();
    return !hasPersonal && !hasProfile && !hasExperiences && !hasEducation && !hasSkills;
}

function getEmptyStateHtml() {
    return `
        <div class="flex flex-col items-center justify-center text-center py-16 px-6 select-none" style="min-height: 400px;">
            <div class="mb-6 opacity-80">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="25" y="10" width="70" height="95" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
                    <rect x="35" y="24" width="50" height="6" rx="3" fill="#cbd5e1"/>
                    <rect x="42" y="34" width="36" height="4" rx="2" fill="#e2e8f0"/>
                    <rect x="35" y="48" width="50" height="3" rx="1.5" fill="#e2e8f0"/>
                    <rect x="35" y="55" width="45" height="3" rx="1.5" fill="#e2e8f0"/>
                    <rect x="35" y="62" width="48" height="3" rx="1.5" fill="#e2e8f0"/>
                    <rect x="35" y="76" width="50" height="3" rx="1.5" fill="#e2e8f0"/>
                    <rect x="35" y="83" width="40" height="3" rx="1.5" fill="#e2e8f0"/>
                    <rect x="35" y="90" width="44" height="3" rx="1.5" fill="#e2e8f0"/>
                    <circle cx="88" cy="92" r="20" fill="#ccfbf1" stroke="#5eead4" stroke-width="2"/>
                    <path d="M82 92 L86 96 L94 88" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-400 mb-2">Pratinjau CV Anda Akan Muncul Di Sini</h3>
            <p class="text-sm text-slate-400 max-w-xs leading-relaxed">
                Mulai isi formulir di sebelah kiri — nama, ringkasan, pengalaman, pendidikan, dan keahlian Anda. 
                Pratinjau akan diperbarui secara otomatis saat Anda mengetik.
            </p>
            <div class="mt-6 flex items-center gap-2 text-xs text-teal-500 font-semibold">
                <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Menunggu input...
            </div>
        </div>
    `;
}

function updatePreview() {
    if (isStateEmpty()) {
        dom.resumeRenderArea.innerHTML = getEmptyStateHtml();
    } else {
        const md = generateCvMarkdown();
        dom.resumeRenderArea.innerHTML = formatMarkdown(md);
    }
    saveToLocalStorage();
}

function syncStaticInputs() {
    dom.fullname.value = state.personal.fullname || '';
    dom.jobtitle.value = state.personal.jobtitle || '';
    dom.email.value = state.personal.email || '';
    dom.phone.value = state.personal.phone || '';
    dom.linkedin.value = state.personal.linkedin || '';
    dom.location.value = state.personal.location || '';
    dom.profile.value = state.profile || '';
    dom.skills.value = state.skills || '';
}

function renderExperienceList() {
    dom.experienceContainer.innerHTML = '';
    state.experiences.forEach((exp, index) => {
        const item = document.createElement('div');
        item.className = 'border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex flex-col gap-3 relative group transition-all hover:border-slate-200';
        item.dataset.id = exp.id;
        
        item.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                <span class="text-xs font-bold text-slate-500">Pekerjaan #${index + 1}</span>
                <button type="button" class="btn-delete-exp text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer">
                    🗑️ Hapus
                </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Perusahaan</label>
                    <input type="text" class="input-exp-company w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 bg-white" placeholder="Contoh: PT GoTo" value="${exp.company || ''}">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Jabatan</label>
                    <input type="text" class="input-exp-role w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 bg-white" placeholder="Contoh: Frontend Engineer" value="${exp.role || ''}">
                </div>
                <div class="sm:col-span-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Periode Kerja</label>
                    <input type="text" class="input-exp-period w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 bg-white" placeholder="Contoh: Jan 2021 - Des 2023" value="${exp.period || ''}">
                </div>
                <div class="sm:col-span-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Deskripsi & Pencapaian</label>
                    <textarea rows="3" class="input-exp-desc w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 resize-none bg-white font-mono" placeholder="Gunakan bullet points untuk mendeskripsikan pencapaian Anda...\n- Contoh: Meningkatkan kecepatan muat halaman sebesar 20%\n- Memimpin peluncuran fitur X">${exp.description || ''}</textarea>
                </div>
            </div>
        `;
        
        // Add event listeners for fields inside
        item.querySelector('.input-exp-company').addEventListener('input', (e) => {
            exp.company = e.target.value;
            updatePreview();
        });
        item.querySelector('.input-exp-role').addEventListener('input', (e) => {
            exp.role = e.target.value;
            updatePreview();
        });
        item.querySelector('.input-exp-period').addEventListener('input', (e) => {
            exp.period = e.target.value;
            updatePreview();
        });
        item.querySelector('.input-exp-desc').addEventListener('input', (e) => {
            exp.description = e.target.value;
            updatePreview();
        });
        
        // Delete action
        item.querySelector('.btn-delete-exp').addEventListener('click', () => {
            state.experiences = state.experiences.filter(x => x.id !== exp.id);
            renderExperienceList();
            updatePreview();
            showToast('Pengalaman kerja berhasil dihapus.');
        });
        
        dom.experienceContainer.appendChild(item);
    });
}

function renderEducationList() {
    dom.educationContainer.innerHTML = '';
    state.educationList.forEach((edu, index) => {
        const item = document.createElement('div');
        item.className = 'border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex flex-col gap-3 relative group transition-all hover:border-slate-200';
        item.dataset.id = edu.id;
        
        item.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                <span class="text-xs font-bold text-slate-500">Pendidikan #${index + 1}</span>
                <button type="button" class="btn-delete-edu text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer">
                    🗑️ Hapus
                </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Sekolah / Universitas</label>
                    <input type="text" class="input-edu-school w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 bg-white" placeholder="Contoh: Universitas Indonesia" value="${edu.school || ''}">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Gelar / Jurusan</label>
                    <input type="text" class="input-edu-degree w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 bg-white" placeholder="Contoh: S1 Ilmu Komputer" value="${edu.degree || ''}">
                </div>
                <div class="sm:col-span-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Periode Pendidikan / Tahun Kelulusan</label>
                    <input type="text" class="input-edu-period w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 bg-white" placeholder="Contoh: 2018 - 2022" value="${edu.period || ''}">
                </div>
                <div class="sm:col-span-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Deskripsi / Catatan Tambahan (Opsional)</label>
                    <textarea rows="2" class="input-edu-desc w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 resize-none bg-white" placeholder="Contoh: Lulus dengan IPK 3.85 (Cum Laude). Aktif di Senat Mahasiswa...">${edu.description || ''}</textarea>
                </div>
            </div>
        `;
        
        // Add event listeners for fields inside
        item.querySelector('.input-edu-school').addEventListener('input', (e) => {
            edu.school = e.target.value;
            updatePreview();
        });
        item.querySelector('.input-edu-degree').addEventListener('input', (e) => {
            edu.degree = e.target.value;
            updatePreview();
        });
        item.querySelector('.input-edu-period').addEventListener('input', (e) => {
            edu.period = e.target.value;
            updatePreview();
        });
        item.querySelector('.input-edu-desc').addEventListener('input', (e) => {
            edu.description = e.target.value;
            updatePreview();
        });
        
        // Delete action
        item.querySelector('.btn-delete-edu').addEventListener('click', () => {
            state.educationList = state.educationList.filter(x => x.id !== edu.id);
            renderEducationList();
            updatePreview();
            showToast('Pendidikan berhasil dihapus.');
        });
        
        dom.educationContainer.appendChild(item);
    });
}

// ============================================================================
// EXPORTS & DOWNLOADS
// ============================================================================
function convertMarkdownToWordHtml(text) {
    if (!text) return '';

    let content = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;span&gt;/g, '<span>')
        .replace(/&lt;\/span&gt;/g, '</span>');

    content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    content = content.replace(/\*(.*?)\*/g, '<i>$1</i>');

    const lines = content.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
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
            // Special handling for: ### <span>Left</span> <span>Right</span>
            // Since Word rendering of flex is poor, let's extract the span content or write it cleanly
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

    if (inList) {
        html += '</ul>\n';
    }

    return html;
}

function downloadDocx() {
    const md = generateCvMarkdown();
    if (!md) {
        showToast('CV kosong! Mohon isi data terlebih dahulu.', 'error');
        return;
    }

    try {
        const bodyContent = convertMarkdownToWordHtml(md);

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
        
        const safeName = (state.personal.fullname || 'Resume').trim().replace(/\s+/g, '_');
        a.download = `CV_ATS_Manual_${safeName}.doc`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(downloadUrl);
        a.remove();

        showToast('File DOCX berhasil diunduh! Buka dengan Word untuk mengedit.');
    } catch (err) {
        console.error('❌ DOCX Download Error:', err);
        showToast('Gagal mengunduh file DOCX.', 'error');
    }
}

async function downloadPdf() {
    const md = generateCvMarkdown();
    if (!md) {
        showToast('CV kosong! Mohon isi data terlebih dahulu.', 'error');
        return;
    }
    
    if (state.isDownloadingPdf) return;

    state.isDownloadingPdf = true;
    dom.btnDownloadPdf.disabled = true;
    const originalText = dom.btnDownloadPdf.innerHTML;
    dom.btnDownloadPdf.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> Memproses PDF...
    `;

    showToast('Sedang membuat berkas PDF Anda...');

    try {
        const printHtml = convertMarkdownToCleanPrintHtml(md);

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
            const errMsg = errJson.error?.message || 'Gagal menghasilkan PDF dari server.';
            throw new Error(errMsg);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        const safeName = (state.personal.fullname || 'Resume').trim().replace(/\s+/g, '_');
        a.download = `CV_ATS_Manual_${safeName}.pdf`;
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
// EVENT LISTENERS & SETUP
// ============================================================================
function setupEventListeners() {
    // Personal Info & Profile events
    const staticInputs = [
        { el: dom.fullname, key: 'fullname', type: 'personal' },
        { el: dom.jobtitle, key: 'jobtitle', type: 'personal' },
        { el: dom.email, key: 'email', type: 'personal' },
        { el: dom.phone, key: 'phone', type: 'personal' },
        { el: dom.linkedin, key: 'linkedin', type: 'personal' },
        { el: dom.location, key: 'location', type: 'personal' },
        { el: dom.profile, key: 'profile', type: 'root' },
        { el: dom.skills, key: 'skills', type: 'root' }
    ];
    
    staticInputs.forEach(input => {
        input.el.addEventListener('input', (e) => {
            if (input.type === 'personal') {
                state.personal[input.key] = e.target.value;
            } else {
                state[input.key] = e.target.value;
            }
            updatePreview();
        });
    });
    
    // Add Experience
    dom.btnAddExperience.addEventListener('click', () => {
        const newExp = {
            id: `exp-${Date.now()}`,
            company: '',
            role: '',
            period: '',
            description: ''
        };
        state.experiences.push(newExp);
        renderExperienceList();
        updatePreview();
        showToast('Kolom pengalaman kerja ditambahkan.');
    });
    
    // Add Education
    dom.btnAddEducation.addEventListener('click', () => {
        const newEdu = {
            id: `edu-${Date.now()}`,
            school: '',
            degree: '',
            period: '',
            description: ''
        };
        state.educationList.push(newEdu);
        renderEducationList();
        updatePreview();
        showToast('Kolom pendidikan ditambahkan.');
    });
    
    // Reset Form
    dom.btnResetForm.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus semua data yang ada di formulir?')) {
            state = {
                personal: { fullname: '', jobtitle: '', email: '', phone: '', linkedin: '', location: '' },
                profile: '',
                experiences: [],
                educationList: [],
                skills: '',
                isDownloadingPdf: false
            };
            syncStaticInputs();
            renderExperienceList();
            renderEducationList();
            updatePreview();
            showToast('Formulir berhasil dikosongkan.', 'success');
        }
    });
    
    // Downloads
    dom.btnDownloadDocx.addEventListener('click', downloadDocx);
    dom.btnDownloadPdf.addEventListener('click', downloadPdf);
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    syncStaticInputs();
    renderExperienceList();
    renderEducationList();
    updatePreview();
    setupEventListeners();
    console.log('✅ CV Manual Builder Initialized');
});
