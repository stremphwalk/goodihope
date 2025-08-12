#!/usr/bin/env node

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist/public')));

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚀 Production build serving at http://localhost:${PORT}`);
  console.log('✨ Fast testing server ready!');
});