/**
 * Hello Work ID - Floating Chatbot Widget
 * Vanilla JavaScript - Secured with Next.js Backend Proxy
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Detect expanded-only mode from URL parameters
function isExpandedOnlyMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('expanded') === 'true' || params.get('fullscreen') === 'true';
}

const widgetState = {
    isOpen: false,
    selectedFile: null,
    selectedFileBase64: null,
    messages: [],
    isTyping: false,
    expandedOnly: isExpandedOnlyMode(),
};

// ============================================================================
// DOM ELEMENT CACHING
// ============================================================================

let domElements = {};

function cacheElements() {
    domElements = {
        root: document.getElementById('widget-root'),
        fileInput: document.getElementById('file-input'),
        fab: null,
        chatWindow: null,
        closeBtn: null,
        enterFullscreenBtn: null,
        exitFullscreenBtn: null,
        messagesContainer: null,
        inputField: null,
        sendBtn: null,
        attachmentBtn: null,
        filePreviewBar: null,
        removeFileBtn: null,
    };
}

// ============================================================================
// RENDER WIDGET UI
// ============================================================================

function renderWidget() {
    const widget = document.createElement('div');
    widget.setAttribute('data-expanded-only', widgetState.expandedOnly ? 'true' : 'false');
    widget.innerHTML = `
        <!-- Floating Action Button -->
        <button class="fab-button" id="fab-btn" aria-label="Buka Hello Work ID">
            💬
        </button>

        <!-- Chat Window -->
        <div class="chat-window" id="chat-window">
            <!-- Header -->
            <div class="chat-header">
                <div class="header-content">
                    <div class="avatar">HW</div>
                    <div class="header-text">
                        <h3>Hello Work ID</h3>
                        <p>
                            <span class="status-dot"></span>
                            Online
                        </p>
                    </div>
                </div>
                <div class="header-actions">
                    <button class="fullscreen-btn enter" id="enter-fullscreen-btn" aria-label="Perbesar jendela chat" ${widgetState.expandedOnly ? 'style="display:none"' : ''}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
                            <path d="M8 3H3v5" />
                            <path d="M16 3h5v5" />
                            <path d="M21 16v5h-5" />
                            <path d="M3 16v5h5" />
                        </svg>
                    </button>
                    <button class="fullscreen-btn exit" id="exit-fullscreen-btn" aria-label="Perkecil jendela chat" ${!widgetState.expandedOnly ? 'style="display:none"' : ''}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
                            <path d="M9 3h6v6" />
                            <path d="M15 21h-6v-6" />
                            <path d="M3 9v6h6" />
                            <path d="M21 15v-6h-6" />
                        </svg>
                    </button>
                    <button class="close-btn" id="close-btn" aria-label="Tutup obrolan" ${widgetState.expandedOnly ? 'style="display:none"' : ''}>
                        ✕
                    </button>
                </div>
            </div>

            <!-- Messages Container -->
            <div class="messages-container" id="messages-container">
                <div class="message bot">
                    <div class="message-bubble">
                        Halo! 👋 Saya Hello Work ID, asisten karir Anda. Bagaimana saya bisa membantu Anda hari ini?
                    </div>
                </div>
            </div>

            <!-- File Preview Bar -->
            <div class="file-preview-bar" id="file-preview-bar">
                <span class="file-name" id="file-name"></span>
                <button class="remove-file-btn" id="remove-file-btn" aria-label="Hapus file">
                    ✕
                </button>
            </div>

            <!-- Input Bar -->
            <div class="input-bar">
                <button type="button" class="attachment-btn" id="attachment-btn" aria-label="Unggah file PDF">
                    📎
                </button>
                <input
                    type="text"
                    class="input-field"
                    id="input-field"
                    placeholder="Ketik pertanyaan atau unggah CV PDF..."
                    aria-label="Masukkan pesan Anda"
                />
                <button type="button" class="send-btn" id="send-btn" aria-label="Kirim pesan">
                    ➤
                </button>
            </div>
        </div>
    `;

    cacheElements();
    domElements.root.appendChild(widget);
    updateElementCache();
}

function updateElementCache() {
    domElements.fab = document.getElementById('fab-btn');
    domElements.chatWindow = document.getElementById('chat-window');
    domElements.closeBtn = document.getElementById('close-btn');
    domElements.enterFullscreenBtn = document.getElementById('enter-fullscreen-btn');
    domElements.exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');
    domElements.messagesContainer = document.getElementById('messages-container');
    domElements.inputField = document.getElementById('input-field');
    domElements.sendBtn = document.getElementById('send-btn');
    domElements.attachmentBtn = document.getElementById('attachment-btn');
    domElements.filePreviewBar = document.getElementById('file-preview-bar');
    domElements.removeFileBtn = document.getElementById('remove-file-btn');
}

// ============================================================================
// CHAT WINDOW TOGGLE
// ============================================================================

function toggleChat() {
    widgetState.isOpen = !widgetState.isOpen;

    if (widgetState.isOpen) {
        domElements.chatWindow.classList.add('open');
        domElements.inputField.focus();
    } else {
        domElements.chatWindow.classList.remove('open');
    }
}

// Handle close button - collapse expanded mode first if needed
function handleCloseClick() {
    // If chat is in expanded mode, collapse it first
    if (domElements.chatWindow.classList.contains('expanded')) {
        collapseChat();
    }
    // Then close the chat
    toggleChat();
}

// Expand chat window to fill viewport (no true fullscreen API)
function expandChat() {
    domElements.chatWindow.classList.add('expanded');
    if (domElements.enterFullscreenBtn) domElements.enterFullscreenBtn.style.display = 'none';
    if (domElements.exitFullscreenBtn) domElements.exitFullscreenBtn.style.display = 'flex';
    if (domElements.fab) domElements.fab.style.display = 'none';
}

function collapseChat() {
    // Prevent collapse in expanded-only mode
    if (widgetState.expandedOnly) return;
    
    domElements.chatWindow.classList.remove('expanded');
    if (domElements.enterFullscreenBtn) domElements.enterFullscreenBtn.style.display = 'flex';
    if (domElements.exitFullscreenBtn) domElements.exitFullscreenBtn.style.display = 'none';
    if (domElements.fab) domElements.fab.style.display = '';
}

// ============================================================================
// FILE HANDLING
// ============================================================================

function triggerFileInput() {
    domElements.fileInput.click();
}

function handleFileSelected(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert('Mohon unggah file PDF saja.');
        domElements.fileInput.value = '';
        return;
    }

    // Limit file size to 3.5 MB (3.5 * 1024 * 1024 bytes)
    const maxSizeBytes = 3.5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        alert('Ukuran berkas terlalu besar! Maksimal ukuran file CV adalah 3.5 MB.');
        domElements.fileInput.value = '';
        return;
    }

    widgetState.selectedFile = file;
    showFilePreview(file.name);

    // Convert file to Base64 to send to backend proxy
    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Data = e.target.result.split(',')[1];
        widgetState.selectedFileBase64 = base64Data;
        console.log('✅ File PDF berhasil dikonversi ke Base64');
    };
    reader.onerror = function () {
        console.error('❌ Gagal membaca berkas PDF');
        alert('Gagal membaca berkas PDF.');
        removeFile();
    };
    reader.readAsDataURL(file);
}

function showFilePreview(fileName) {
    domElements.filePreviewBar.classList.add('show');
    document.getElementById('file-name').textContent = `📄 ${fileName}`;
}

function removeFile() {
    widgetState.selectedFile = null;
    widgetState.selectedFileBase64 = null;
    domElements.fileInput.value = '';
    domElements.filePreviewBar.classList.remove('show');
}

// ============================================================================
// MESSAGE HANDLING & MARKDOWN FORMATTER
// ============================================================================

function formatMarkdown(text) {
    if (!text) return '';

    // Escape HTML to prevent XSS
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Bold text (**bold**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic text (*italic*)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bullet points (lines starting with - or * followed by a space)
    const lines = html.split('\n');
    let inList = false;
    const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listContent = trimmed.substring(2);
            let result = '';
            if (!inList) {
                result += '<ul style="margin-left: 20px; list-style-type: disc; margin-bottom: 8px;">';
                inList = true;
            }
            result += `<li style="margin-bottom: 4px;">${listContent}</li>`;
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

    // Convert newlines to <br> for spacing (except inside lists or empty lines)
    return formattedLines.join('\n').replace(/\n/g, '<br>');
}

function appendMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (isUser) {
        bubble.textContent = text;
    } else {
        bubble.innerHTML = formatMarkdown(text);
    }

    messageDiv.appendChild(bubble);
    domElements.messagesContainer.appendChild(messageDiv);

    scrollToBottom();
}

function showTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.id = 'typing-indicator';

    const bubble = document.createElement('div');
    bubble.className = 'typing-indicator';
    bubble.innerHTML = `
        Hello Work ID sedang mengetik
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    `;

    messageDiv.appendChild(bubble);
    domElements.messagesContainer.appendChild(messageDiv);

    scrollToBottom();
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function scrollToBottom() {
    domElements.messagesContainer.scrollTop = domElements.messagesContainer.scrollHeight;
}

// ============================================================================
// BACKEND API SUBMISSION
// ============================================================================

async function handleFormSubmit(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    const message = domElements.inputField.value.trim();
    const hasFile = widgetState.selectedFile !== null;

    if (!message && !hasFile) return;

    // Append user message
    if (message) {
        appendMessage(message, true);
    }

    // Capture file data and name if uploaded
    let fileBase64 = null;
    let fileName = null;
    if (hasFile) {
        fileBase64 = widgetState.selectedFileBase64;
        fileName = widgetState.selectedFile.name;
        appendMessage(`📎 CV Diunggah: ${fileName}`, true);
    }

    // Clear UI inputs immediately
    domElements.inputField.value = '';
    removeFile();

    // Show typing indicator
    widgetState.isTyping = true;
    showTypingIndicator();

    // Construct the user message parts for Gemini API
    const userParts = [];
    if (fileBase64) {
        userParts.push({
            inlineData: {
                mimeType: "application/pdf",
                data: fileBase64
            }
        });
    }
    userParts.push({
        text: message || "Tolong analisis file CV PDF yang saya unggah ini secara detail dan berikan saran konstruktif."
    });

    const userMessageObj = {
        role: "user",
        parts: userParts
    };

    try {
        // Call our Next.js backend proxy API securely
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    ...widgetState.messages,
                    userMessageObj
                ]
            })
        });

        removeTypingIndicator();
        widgetState.isTyping = false;

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const errMessage = errJson.error?.message || 'Gagal terhubung dengan backend proxy api.';
            throw new Error(errMessage);
        }

        const data = await response.json();
        const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!botText) {
            throw new Error('Respons tidak dapat dimengerti oleh sistem.');
        }

        // Show bot message
        appendMessage(botText, false);

        // Store chat history
        widgetState.messages.push(userMessageObj);
        widgetState.messages.push({
            role: "model",
            parts: [{ text: botText }]
        });

    } catch (error) {
        removeTypingIndicator();
        widgetState.isTyping = false;
        console.error('❌ Proxy API Error:', error);

        const displayError = `Terjadi kesalahan saat menghubungi server: ${error.message}`;
        appendMessage(displayError, false);
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function attachEventListeners() {
    // Chat toggle
    domElements.fab.addEventListener('click', toggleChat);
    domElements.closeBtn.addEventListener('click', handleCloseClick);

    // File handling
    domElements.attachmentBtn.addEventListener('click', triggerFileInput);
    domElements.fileInput.addEventListener('change', handleFileSelected);
    domElements.removeFileBtn.addEventListener('click', removeFile);

    // Expand/Collapse buttons
    if (domElements.enterFullscreenBtn) domElements.enterFullscreenBtn.addEventListener('click', expandChat);
    if (domElements.exitFullscreenBtn) domElements.exitFullscreenBtn.addEventListener('click', collapseChat);

    // Submission handlers
    domElements.inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleFormSubmit();
        }
    });

    domElements.sendBtn.addEventListener('click', handleFormSubmit);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    renderWidget();
    attachEventListeners();
    
    // Auto-expand and open chat in expanded-only mode
    if (widgetState.expandedOnly) {
        widgetState.isOpen = true;
        domElements.chatWindow.classList.add('open');
        expandChat();
        domElements.inputField.focus();
    }
    
    console.log('✅ Hello Work ID Widget initialized with backend proxy support');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
