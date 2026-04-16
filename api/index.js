import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFile } from './services/parser.js';
import { buildTree } from './services/treeBuilder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── API Routes ─────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return res.status(400).json({ error: 'Invalid file type. Please upload .xlsx, .xls, or .csv' });
    }

    const employees = parseFile(req.file.buffer, ext);
    if (!employees.length) {
      return res.status(400).json({ error: 'No employee data found in the file' });
    }

    const result = buildTree(employees);
    res.json(result);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + (err instanceof Error ? err.message : 'Unknown error') });
  }
});

// ─── Serve production build ─────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback: any non-API route serves index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Conditionally listen (Vercel serverless handles listening internally)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel Serverless compatibility
export default app;
