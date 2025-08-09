import type { VercelRequest, VercelResponse } from '@vercel/node';
import WebSocket from 'ws';

// Vercel serverless function for streaming translation
// This uses Server-Sent Events (SSE) instead of WebSockets
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SONIOX_API_KEY = process.env.SONIOX_API_KEY;
  if (!SONIOX_API_KEY) {
    return res.status(500).json({ error: 'Translation service not configured' });
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    // Connect to Soniox
    const sonioxWs = new WebSocket('wss://api.soniox.com/translate-realtime', {
      headers: {
        Authorization: `Bearer ${SONIOX_API_KEY}`,
      },
    });

    sonioxWs.on('open', () => {
      res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);
      
      // Forward config from request body
      if (req.body) {
        sonioxWs.send(JSON.stringify(req.body));
      }
    });

    sonioxWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        res.write(`data: ${JSON.stringify(msg)}\n\n`);
      } catch (err) {
        console.error('Parse error:', err);
      }
    });

    sonioxWs.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: 'Translation service error' })}\n\n`);
      res.end();
    });

    sonioxWs.on('close', () => {
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      sonioxWs.close();
    });

  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: 'Failed to connect to translation service' })}\n\n`);
    res.end();
  }
}