const express    = require('express');
const { promisify } = require('util');
const _b         = require('brightness');

const set = promisify(_b.set.bind(_b));
const get = promisify(_b.get.bind(_b));

const app  = express();
const PORT = 7777;

app.use(express.json());

// Allow browser direct calls
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// POST /brightness  { level: 0-100 }
app.post('/brightness', async (req, res) => {
    const level = parseFloat(req.body.level);
    if (isNaN(level) || level < 0 || level > 100)
        return res.status(400).json({ error: 'level must be 0-100' });

    try {
        await set(level / 100);   // brightness expects 0.0–1.0
        res.json({ ok: true, level });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /brightness
app.get('/brightness', async (req, res) => {
    try {
        const val = await get();
        res.json({ level: Math.round(val * 100) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Brightness worker → http://127.0.0.1:${PORT}`);
});
