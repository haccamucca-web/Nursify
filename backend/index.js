import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFParse } from 'pdf-parse';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Route
app.get('/status', (req, res) => res.send('OK'));

// Set up multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Sei un tutor clinico esperto in scienze infermieristiche. Il tuo compito è riassumere in modo molto dettagliato questo testo universitario. NON essere troppo sintetico. Mantieni i concetti clinici cruciali, le definizioni, le procedure, le avvertenze sui farmaci, i dosaggi e la terminologia medica esatta. Struttura la risposta usando titoli, elenchi puntati e paragrafi distanziati per facilitare lo studio su schermo mobile.`;

// Utility to chunk text roughly by words with an overlap to maintain clinical context
function chunkText(text, wordsPerChunk = 2000, overlapWords = 200) {
    const words = text.split(/\s+/);
    const chunks = [];
    
    if (words.length === 0) return chunks;
    if (words.length <= wordsPerChunk) return [text];

    let startIndex = 0;
    while (startIndex < words.length) {
        const endIndex = Math.min(startIndex + wordsPerChunk, words.length);
        const chunkWords = words.slice(startIndex, endIndex);
        chunks.push(chunkWords.join(' '));
        
        startIndex += (wordsPerChunk - overlapWords);
    }
    
    return chunks;
}
app.post('/api/extract-text', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nessun file PDF caricato.' });
        }

        console.log('--- NUOVA RICHIESTA RICEVUTA ---');
        console.log('Ricevuto PDF, inizia l\'estrazione del testo...');
        
        let textResult;
        try {
            const parser = new PDFParse({ data: req.file.buffer });
            textResult = await parser.getText();
        } catch (parseError) {
            console.error('Errore esatto durante il parsing del PDF:', parseError);
            return res.status(500).json({ error: 'Impossibile leggere il file PDF (potrebbe essere corrotto o protetto da password).', details: parseError.message });
        }
        const text = textResult.text;

        if (!text || text.trim().length === 0) {
             return res.status(400).json({ error: 'Impossibile estrarre o trovare testo nel PDF.' });
        }

        console.log(`Testo estratto con successo: ${text.length} caratteri.`);
        
        // Rigorous chunking: roughly 3000 tokens per chunk (~2250 words) with 300 tokens overlap (~225 words)
        const wordsPerChunk = 2250;
        const overlapWords = 225;
        const chunks = chunkText(text, wordsPerChunk, overlapWords);
        
        console.log(`Testo diviso in ${chunks.length} frammenti (circa ${wordsPerChunk} parole l'uno con ${overlapWords} parole di sovrapposizione).`);
        res.json({ chunks: chunks });

    } catch (error) {
        console.error(error);
        console.error('Errore durante l\'estrazione:', error);
        res.status(500).json({ error: 'Errore interno del server durante l\'estrazione del PDF.', details: error.message });
    }
});

app.post('/api/summarize-chunk', async (req, res) => {
    try {
        const { chunk, index, total } = req.body;
        
        if (!chunk) {
            return res.status(400).json({ error: 'Nessun frammento di testo (chunk) fornito.' });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'inserisci_qui_la_tua_api_key') {
            console.error('Nessuna API Key configurata. Impossibile contattare l\'LLM.');
            return res.status(500).json({ error: "Configurazione server incompleta: API Key Gemini mancante." });
        }
        
        const RIGOROUS_SYSTEM_PROMPT = `Sei un assistente accademico e analista esperto. Il tuo compito è leggere il testo fornito e creare un riassunto molto dettagliato, accurato e strutturato. Adattati automaticamente all'argomento del testo (che sia medico, tecnico, giuridico, umanistico o altro). NON essere troppo sintetico. Devi estrarre e strutturare con precisione i concetti chiave, le definizioni importanti, le procedure o i dati rilevanti presenti nel documento. Struttura l'output in formato Markdown pulito usando titoli (H2, H3), elenchi puntati e paragrafi ben distanziati per facilitare lo studio e la comprensione.`;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: RIGOROUS_SYSTEM_PROMPT });

        console.log(`Analisi frammento ${index || 'N/A'} di ${total || 'N/A'}...`);
        let result;
        try {
            result = await model.generateContent(chunk);
        } catch (geminiError) {
            console.error('Errore esatto durante la chiamata a Gemini (summarize-chunk):', geminiError);
            const errorDetails = geminiError?.message || JSON.stringify(geminiError, Object.getOwnPropertyNames(geminiError)) || 'Errore sconosciuto da Google AI';
            return res.status(500).json({ error: 'Errore di comunicazione con l\'API di Gemini.', details: errorDetails });
        }
        const response = await result.response;
        const chunkSummary = response.text();
            
        console.log(`Frammento elaborato con successo.`);
        res.json({ summary: chunkSummary });

    } catch (error) {
        console.error('Errore durante l\'elaborazione:', error);
        res.status(500).json({ error: 'Errore interno del server durante l\'elaborazione del PDF.', details: error.message });
    }
});

app.post('/api/refine-summary', async (req, res) => {
    try {
        const { text, action } = req.body;
        
        if (!text || !action) {
            return res.status(400).json({ error: 'Testo o azione mancante.' });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'inserisci_qui_la_tua_api_key') {
            return res.status(500).json({ error: "API Key Gemini mancante." });
        }

        let systemInstruction = "";
        if (action === "improve") {
            systemInstruction = "Sei un editor accademico professionista. Migliora la fluidità, la sintassi e la professionalità del seguente testo, mantenendo intatte tutte le informazioni originali ma elevando il registro stilistico. Restituisci il testo formattato in Markdown.";
        } else if (action === "rewrite") {
            systemInstruction = "Sei un tutor didattico eccezionale. Riscrivi il seguente testo semplificando il linguaggio complesso in modo che sia comprensibile anche a uno studente al primo anno o a un profano, pur mantenendo l'accuratezza clinica o tecnica. Usa analogie se necessario. Formatta in Markdown.";
        } else if (action === "quiz") {
            systemInstruction = "Sei un creatore di test a risposta multipla. Esamina il testo fornito e genera esattamente 3 domande a scelta multipla basate sui concetti chiave. Per ogni domanda fornisci 4 opzioni di risposta (A, B, C, D) e, subito dopo le domande, mostra le soluzioni corrette con una brevissima spiegazione. Formatta tutto in modo chiaro usando Markdown.";
        } else {
            return res.status(400).json({ error: "Azione non valida." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction });

        console.log(`Esecuzione azione avanzata: ${action}`);
        let result;
        try {
            result = await model.generateContent(text);
        } catch (geminiError) {
            console.error('Errore esatto durante la chiamata a Gemini (refine-summary):', geminiError);
            const errorDetails = geminiError?.message || JSON.stringify(geminiError, Object.getOwnPropertyNames(geminiError)) || 'Errore sconosciuto da Google AI';
            return res.status(500).json({ error: 'Errore di comunicazione con l\'API di Gemini.', details: errorDetails });
        }
        const response = await result.response;
        const refinedText = response.text();
            
        console.log(`Azione completata con successo: ${action}`);
        res.json({ result: refinedText });

    } catch (error) {
        console.error('Errore durante il refining:', error);
        res.status(500).json({ error: 'Errore interno del server durante l\'affinamento del testo.', details: error.message });
    }
});

app.post('/api/verify-password', (req, res) => {
    const { password } = req.body;
    const sitePassword = process.env.SITE_PASSWORD;
    
    if (!sitePassword) {
        return res.status(500).json({ error: 'Configurazione server incompleta: SITE_PASSWORD mancante.' });
    }

    if (password === sitePassword) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Password errata' });
    }
});

const server = app.listen(port, () => {
    console.log(`Backend in ascolto sulla porta ${port}`);
});
server.on('error', (e) => {
    console.error('Server error:', e);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
