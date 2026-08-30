const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(__dirname));

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/applications', (req, res) => {
  res.json(readData());
});

app.get('/api/applications/:plot', (req, res) => {
  const plot = req.params.plot;
  const data = readData().filter(item => item.plot === plot);
  res.json(data);
});

app.post('/api/applications', (req, res) => {
  const payload = req.body;
  if (!payload.plot || !payload.date) {
    return res.status(400).json({ error: 'plot e date são obrigatórios' });
  }

  const data = readData();
  data.unshift(payload);
  writeData(data);
  res.status(201).json(payload);
});

app.delete('/api/applications', (req, res) => {
  writeData([]);
  res.json({ status: 'cleared' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
