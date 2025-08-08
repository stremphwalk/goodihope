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

  wss.on('connection', async (clientWs) => {
    console.log('🌐 New Live Translation client connected');

    // Connect to Soniox's translate-realtime API
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
      clientWs.send(JSON.stringify({ error: 'Translation service error' }));
    });

    clientWs.on('message', (msg) => {
      try {
        // Forward config messages or audio data directly to Soniox
        sonioxWs.send(msg);
      } catch (err) {
        console.error('⚠️ Error sending message to Soniox:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('❎ Client disconnected from Live Translation');
      sonioxWs.close();
    });
  });

  console.log('✅ Live Translation WebSocket ready at /translate-ws');
}
