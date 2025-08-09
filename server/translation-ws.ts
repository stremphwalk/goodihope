import WebSocket, { WebSocketServer } from 'ws';
import type { Server } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const SONIOX_API_KEY = process.env.SONIOX_API_KEY;
if (!SONIOX_API_KEY) {
  console.error('❌ Missing SONIOX_API_KEY in environment variables.');
}

export function setupTranslationWs(server: Server) {
  const wss = new WebSocketServer({ server, path: '/translate-ws' });

  wss.on('connection', async (clientWs, req) => {
    console.log('🌐 New Live Translation client connected from:', req.headers.origin || 'unknown');

    // Connect to Soniox's translate-realtime API
    if (!SONIOX_API_KEY) {
      console.error('❌ SONIOX_API_KEY not configured');
      clientWs.send(JSON.stringify({ error: 'Translation service not configured' }));
      clientWs.close();
      return;
    }

    const sonioxWs = new WebSocket('wss://api.soniox.com/translate-realtime', {
      headers: {
        Authorization: `Bearer ${SONIOX_API_KEY}`,
      },
    });

    sonioxWs.on('open', () => {
      console.log('🔗 Connected to Soniox translation service');
    });

    sonioxWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Expected Soniox response example:
        // { "source_text": "...", "translated_text": "..." }

        if (msg.source_text || msg.translated_text) {
          clientWs.send(
            JSON.stringify({
              source_text: msg.source_text || '',
              translated_text: msg.translated_text || '',
            })
          );
        }
      } catch (err) {
        console.warn('⚠️ Non-JSON or unexpected message from Soniox', data.toString());
      }
    });

    sonioxWs.on('error', (err) => {
      console.error('❌ Soniox WebSocket error:', err);
      try { 
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ error: 'Translation service error' }));
        }
      } catch {}
    });

    sonioxWs.on('close', () => {
      console.log('🔌 Soniox WebSocket closed');
      try {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close();
        }
      } catch {}
    });

    // Forward messages (binary audio or JSON config)
    clientWs.on('message', (msg, isBinary) => {
      try {
        // console.log('Client message', isBinary ? '(binary audio)' : msg.toString());
        sonioxWs.send(msg, { binary: isBinary });
      } catch (err) {
        console.error('⚠️ Error sending message to Soniox:', err);
      }
    });

    // Keep-alive pings
    const pingInterval = setInterval(() => {
      try {
        if (clientWs.readyState === WebSocket.OPEN) clientWs.ping();
        if (sonioxWs.readyState === WebSocket.OPEN) sonioxWs.ping?.();
      } catch {}
    }, 25000);

    clientWs.on('close', () => {
      console.log('❎ Client disconnected from Live Translation');
      clearInterval(pingInterval);
      sonioxWs.close();
    });
  });

  console.log('✅ Live Translation WebSocket ready at /translate-ws');
}
