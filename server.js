// server.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = 8000;
const JSON_PATH = path.resolve('./qTables.json');
const TMP_PATH  = path.resolve('./qTables.json.tmp');

// Serve everything in /public as static files
app.use(express.static('public'));

// Parse JSON bodies on POST
app.use(express.json({ limit: '5mb' }));


// GET /qtable  → read & return the full mapping
app.get('/qtable', async (req, res) => {
  try {
    const txt = await fs.readFile(JSON_PATH, 'utf8');
    res.json(txt.trim() ? JSON.parse(txt) : {});
  } catch {
    res.json({});
  }
});

// POST /qtable → write the full mapping
// app.post('/qtable', async (req, res) => {
//   try {
//     await fs.writeFile(JSON_PATH, JSON.stringify(req.body, null, 2));
//     res.json({ status: 'ok' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

app.post('/qtable', async (req, res) => {
  try {
    // 1) Write full JSON to a temporary file
    await fs.writeFile(
      TMP_PATH,
      JSON.stringify(req.body, null, 2),
      'utf8'
    );

    // 2) Atomically rename it over the real file
    await fs.rename(TMP_PATH, JSON_PATH);

    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('POST /qtable atomic save failed:', err);
    // Clean up the temp file if it exists
    try { await fs.unlink(TMP_PATH); } catch (_) { /* ignore */ }
    return res.status(500).json({ error: 'Failed to save Q-tables' });
  }
});

app.listen(PORT, () => {
  console.log(`▶️  Server listening on http://localhost:${PORT}`);
});
