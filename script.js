// --- DOM ELEMENTS ---
const els = {
    upload: document.getElementById('fileUploadArea'),
    input: document.getElementById('fileInput'),
    info: document.getElementById('fileInfo'),
    name: document.getElementById('fileName'),
    size: document.getElementById('fileSize'),
    icon: document.getElementById('fileTypeIcon'),
    remove: document.getElementById('removeFile'),
    options: document.querySelectorAll('.option-card'),
    generate: document.getElementById('generateBtn'),
    loading: document.getElementById('loadingContainer'),
    loadText: document.getElementById('loadingText'),
    error: document.getElementById('errorContainer'),
    errMsg: document.getElementById('errorMessage'),
    results: document.getElementById('resultsSection'),
    content: document.getElementById('summaryContent'),
    points: document.getElementById('keyPointsList'),
    copy: document.getElementById('copySummary'),
    download: document.getElementById('downloadSummary')
};

let state = { file: null, length: 'medium' };

// --- EVENTS ---
els.upload.addEventListener('click', () => els.input.click());
els.upload.addEventListener('dragover', e => { e.preventDefault(); els.upload.classList.add('dragover'); });
els.upload.addEventListener('dragleave', () => els.upload.classList.remove('dragover'));
els.upload.addEventListener('drop', e => {
    e.preventDefault(); els.upload.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
els.input.addEventListener('change', e => { if (e.target.files.length) handleFile(e.target.files[0]); });
els.remove.addEventListener('click', e => { e.stopPropagation(); resetUpload(); });
els.options.forEach(c => c.addEventListener('click', () => {
    els.options.forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
    state.length = c.dataset.length;
}));
els.generate.addEventListener('click', processDocument);

els.copy.addEventListener('click', () => {
    navigator.clipboard.writeText(els.content.innerText).then(() => {
        els.copy.innerHTML = '<i class="fas fa-check"></i> Copied';
        setTimeout(() => els.copy.innerHTML = '<i class="fas fa-copy"></i> Copy', 2000);
    });
});

els.download.addEventListener('click', () => {
    const blob = new Blob([els.content.innerText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `summary-${state.file.name.replace(/\.[^/.]+$/, '')}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
});

// --- CORE LOGIC ---
function formatBytes(b) {
    if (b === 0) return '0 Bytes';
    const k = 1024, s = ['Bytes', 'KB', 'MB'], i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
}

function handleFile(file) {
    const valid = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!valid.includes(file.type)) return showError('Invalid type. Please upload a PDF, JPG, or PNG.');
    if (file.size > 10 * 1024 * 1024) return showError('File too large. Maximum size is 10MB.');

    state.file = file;
    els.name.textContent = file.name;
    els.size.textContent = formatBytes(file.size);
    els.icon.className = file.type === 'application/pdf' ? 'fas fa-file-pdf' : 'fas fa-file-image';
    els.info.classList.add('active');
    els.generate.disabled = false;
    els.results.classList.remove('active');
    els.error.classList.remove('active');
}

function resetUpload() {
    state.file = null; els.input.value = ''; els.info.classList.remove('active');
    els.generate.disabled = true; els.results.classList.remove('active'); els.error.classList.remove('active');
}

function showError(msg) {
    els.errMsg.textContent = msg; els.error.classList.add('active'); els.results.classList.remove('active');
}

async function processDocument() {
    if (!state.file) return;

    els.loading.classList.add('active');
    els.results.classList.remove('active');
    els.error.classList.remove('active');
    els.generate.disabled = true;

    let dotCount = 0;
    els.loadText.dataset.phase = 'upload';

    const loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        const dots = '.'.repeat(dotCount);

        if (els.loadText.dataset.phase === 'upload') {
            els.loadText.textContent = `Uploading & extracting text${dots}`;
        }

        if (els.loadText.dataset.phase === 'ai') {
            els.loadText.textContent = `AI is summarizing${dots}`;
        }
    }, 400);

    try {
        const formData = new FormData();
        formData.append('document', state.file);
        formData.append('length', state.length);

        setTimeout(() => {
            els.loadText.dataset.phase = 'ai';
        }, 1200);

        const res = await fetch('/api/summarize', {
            method: 'POST',
            body: formData
        });

        // Read response as text first
        const responseText = await res.text();

        console.log('HTTP status:', res.status);
        console.log('Server response:', responseText);

        // Empty response
        if (!responseText.trim()) {
            throw new Error(
                `Server returned an empty response (HTTP ${res.status}). Check the Node.js terminal.`
            );
        }

        // Try to convert response to JSON
        let result;

        try {
            result = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Invalid JSON from server:', responseText);

            throw new Error(
                `Server did not return JSON. HTTP ${res.status}. Response: ${responseText.substring(0, 300)}`
            );
        }

        if (!res.ok || !result.success) {
            throw new Error(
                result.error || `Server returned HTTP ${res.status}`
            );
        }

        displayResults(result.data);

    } catch (err) {
        console.error('Processing error:', err);

        if (err instanceof TypeError && err.message.includes('fetch')) {
            showError(
                'Cannot reach the backend. Make sure the Node.js server is running.'
            );
        } else {
            showError(err.message);
        }

    } finally {
        clearInterval(loadingInterval);
        els.loading.classList.remove('active');
        els.generate.disabled = false;
    }
}

function displayResults(data) {
    els.content.textContent = data.summary || 'No summary generated.';
    els.points.innerHTML = '';

    if (data.keyPoints && data.keyPoints.length > 0) {
        data.keyPoints.forEach((point, i) => {
            const li = document.createElement('li');
            li.className = 'key-point';
            li.innerHTML = `<div class="key-point-number">${i + 1}</div><div class="key-point-text"></div>`;
            li.querySelector('.key-point-text').textContent = point;
            els.points.appendChild(li);
        });
    } else {
        els.points.innerHTML = '<li style="color: var(--text-muted)">No specific key points extracted.</li>';
    }
    els.results.classList.add('active');
    els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}