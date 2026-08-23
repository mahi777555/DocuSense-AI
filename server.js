require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// Serve the frontend (index.html, features.html, about.html, style.css, script.js)
app.use(express.static(path.join(__dirname, '../client')));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const LENGTH_CONFIG = {
    short: { label: 'a brief 2-3 sentence', sentences: 3 },
    medium: { label: 'a balanced 4-6 sentence', sentences: 5 },
    long: { label: 'a detailed multi-paragraph', sentences: 9 }
};

// ---------- Text extraction ----------
async function extractText(file) {
    if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        return data.text;
    }
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        const { data } = await Tesseract.recognize(file.buffer, 'eng');
        return data.text;
    }
    throw new Error('Unsupported file type.');
}

// ---------- AI summarization (Claude), with an offline fallback ----------
async function summarizeWithClaude(text, length) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null; // signal caller to use fallback

    const cfg = LENGTH_CONFIG[length] || LENGTH_CONFIG.medium;
    const prompt = `You will be given raw text extracted from a document. Respond ONLY with valid JSON
(no markdown fences, no commentary) in this exact shape:
{"summary": "...", "keyPoints": ["...", "..."]}

Write ${cfg.label} summary of the document, and list 4-6 concise key takeaways.

DOCUMENT TEXT:
"""
${text.slice(0, 15000)}
"""`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-5',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Claude API error: ${res.status} ${errBody}`);
    }

    const data = await res.json();
    const raw = data.content.map(b => b.text || '').join('\n').trim();
    const cleaned = raw.replace(/^```json\s*|```$/g, '').trim();
    return JSON.parse(cleaned);
}

// Basic extractive fallback so the app still works with zero setup / no API key
function fallbackSummarize(text, length) {
    const clean = text.replace(/\s+/g, ' ').trim();
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
    const cfg = LENGTH_CONFIG[length] || LENGTH_CONFIG.medium;

    // crude word-frequency scoring to pick the most "important" sentences
    const stop = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'was', 'were', 'it', 'this', 'that', 'with', 'as', 'be', 'by', 'at']);
    const freq = {};
    clean.toLowerCase().split(/\W+/).forEach(w => {
        if (w && !stop.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
    const scored = sentences.map((s, i) => {
        const words = s.toLowerCase().split(/\W+/);
        const score = words.reduce((sum, w) => sum + (freq[w] || 0), 0) / (words.length || 1);
        return { s: s.trim(), i, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, cfg.sentences).sort((a, b) => a.i - b.i);

    const summary = top.map(t => t.s).join(' ');
    const keyPoints = scored.slice(0, 5).sort((a, b) => a.i - b.i).map(t => t.s);

    return { summary, keyPoints };
}

// ---------- Route ----------
app.post('/api/summarize', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

        const length = req.body.length || 'medium';
        const text = await extractText(req.file);

        if (!text || text.trim().length < 20) {
            return res.status(422).json({ success: false, error: 'Could not extract readable text from this file.' });
        }

        let result;
        try {
            result = await summarizeWithClaude(text, length);
        } catch (aiErr) {
            console.error('AI summarization failed, using fallback:', aiErr.message);
            result = null;
        }
        if (!result) {
            result = fallbackSummarize(text, length);
        }

        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message || 'Server error while processing the document.' });
    }
});

app.listen(PORT, () => {
    console.log(`Midnight Scholar server running at http://localhost:${PORT}`);
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('No ANTHROPIC_API_KEY set — using the built-in extractive summarizer as a fallback.');
    }
});