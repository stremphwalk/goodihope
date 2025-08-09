import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Globe } from 'lucide-react';

type Role = 'provider' | 'patient';

interface Message {
  original: string;
  translated: string;
}

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function TranslateConsult() {
  const [providerLang, setProviderLang] = useState<string>('en');
  const [patientLang, setPatientLang] = useState<string>('fr');
  const [providerMessages, setProviderMessages] = useState<Message[]>([]);
  const [patientMessages, setPatientMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const speakerMapRef = useRef<Record<string, Role>>({});

  useEffect(() => {
    const computeWsUrl = (): string => {
      const getParam = (key: string): string | null => {
        const searchParams = new URLSearchParams(window.location.search);
        const fromSearch = searchParams.get(key);
        if (fromSearch) return fromSearch;
        const hash = window.location.hash || '';
        const qIndex = hash.indexOf('?');
        if (qIndex !== -1) {
          const hashQuery = hash.slice(qIndex + 1);
          const hashParams = new URLSearchParams(hashQuery);
          const fromHash = hashParams.get(key);
          if (fromHash) return fromHash;
        }
        return null;
      };

      const wsOverride = getParam('ws');
      if (wsOverride && /^(ws|wss):\/\//i.test(wsOverride)) return wsOverride;

      const baseOverride = getParam('base');
      if (baseOverride) {
        try {
          const base = new URL(baseOverride, window.location.href);
          const wsProtocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
          return `${wsProtocol}//${base.host}/translate-ws`;
        } catch {}
      }

      // Domain-aware permanent mapping for production
      const host = window.location.host.toLowerCase();
      if (host === 'www.arinote.co') {
        return `wss://arinote.co/translate-ws`;
      }

      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      return `${proto}://${window.location.host}/translate-ws`;
    };

    const wsUrl = computeWsUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);

        // Format A (proxy forwarding Soniox "result" objects)
        // { type:'result', speaker:'spk_0', transcript:'...', translation:'...' }
        if (msg?.type === 'result' && (msg.transcript || msg.translation)) {
          const role = getSpeakerRole(msg.speaker);
          const payload: Message = {
            original: String(msg.transcript ?? ''),
            translated: String(msg.translation ?? ''),
          };
          if (role === 'provider') {
            setProviderMessages((prev) => [...prev, payload]);
          } else {
            setPatientMessages((prev) => [...prev, payload]);
          }
          return;
        }

        // Format B (normalized by our latest translation-ws.ts)
        // { source_text:'...', translated_text:'...' }
        if (msg?.source_text || msg?.translated_text) {
          // Heuristic: show "source_text" on Provider side, translation on Patient side
          const left: Message = {
            original: String(msg.source_text ?? ''),
            translated: String(msg.translated_text ?? ''),
          };
          setProviderMessages((prev) => [...prev, left]);

          // Mirror on the right as well if you want duplication; otherwise remove this block.
          const right: Message = {
            original: String(msg.source_text ?? ''),
            translated: String(msg.translated_text ?? ''),
          };
          setPatientMessages((prev) => [...prev, right]);
        }
      } catch {
        // Non-JSON or unexpected message — ignore
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
    };
  }, []);

  const getSpeakerRole = (speakerId: string): Role => {
    if (!speakerId) return 'provider';
    if (!speakerMapRef.current[speakerId]) {
      const roles = Object.values(speakerMapRef.current);
      const newRole: Role = roles.includes('provider') ? 'patient' : 'provider';
      speakerMapRef.current[speakerId] = newRole;
    }
    return speakerMapRef.current[speakerId];
  };

  const startSession = async () => {
    setIsRunning(true);
    setElapsed(0);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);

    // Configure translation
    wsRef.current?.send(
      JSON.stringify({
        type: 'config',
        data: {
          source_language: providerLang,
          target_language: patientLang,
          include_original: true,
          enable_diarization: true,
        },
      }),
    );

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { noiseSuppression: true, echoCancellation: true },
    });
    recorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    recorderRef.current.addEventListener('dataavailable', (e: BlobEvent) => {
      if (!e.data || e.data.size === 0) return;
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;

      e.data.arrayBuffer().then((buf) => {
        wsRef.current?.send(
          JSON.stringify({
            type: 'audio',
            data: Array.from(new Uint8Array(buf)),
          }),
        );
      });
    });

    recorderRef.current.start(250);
  };

  const stopSession = () => {
    setIsRunning(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.stop();
    wsRef.current?.send(JSON.stringify({ type: 'end' }));
    speakerMapRef.current = {};
  };

  const formatTime = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center bg-white shadow p-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Globe className="w-5 h-5 text-blue-500" />
          Live Translation Session
        </div>
        <span className="text-gray-500 text-sm">{formatTime(elapsed)}</span>
      </header>

      {/* Language selectors */}
      <div className="flex flex-wrap gap-6 p-4 justify-center bg-white shadow-sm">
        {/* Provider language */}
        <div>
          <label className="block text-sm font-medium mb-1">Provider Language</label>
          <div className="flex items-center gap-2">
            <span>{languages.find((l) => l.code === providerLang)?.flag}</span>
            <select
              value={providerLang}
              onChange={(e) => setProviderLang(e.target.value)}
              className="border rounded-lg px-3 py-2"
              disabled={isRunning}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Patient language */}
        <div>
          <label className="block text-sm font-medium mb-1">Patient Language</label>
          <div className="flex items-center gap-2">
            <span>{languages.find((l) => l.code === patientLang)?.flag}</span>
            <select
              value={patientLang}
              onChange={(e) => setPatientLang(e.target.value)}
              className="border rounded-lg px-3 py-2"
              disabled={isRunning}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conversation panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 flex-grow">
        {/* Provider */}
        <div className="bg-gradient-to-b from-blue-50 to-white shadow-lg rounded-2xl p-4 h-[70vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Provider</h2>
          <AnimatePresence>
            {providerMessages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 p-3 rounded-lg bg-white shadow-sm"
              >
                <p className="text-sm text-gray-500">Original: {m.original}</p>
                <p className="text-lg font-semibold text-blue-700">
                  {m.translated}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Patient */}
        <div className="bg-gradient-to-b from-green-50 to-white shadow-lg rounded-2xl p-4 h-[70vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Patient</h2>
          <AnimatePresence>
            {patientMessages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 p-3 rounded-lg bg-white shadow-sm"
              >
                <p className="text-sm text-gray-500">Original: {m.original}</p>
                <p className="text-lg font-semibold text-green-700">
                  {m.translated}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 p-4 bg-white shadow-inner">
        {!isRunning ? (
          <button
            onClick={startSession}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full shadow-lg text-lg font-semibold"
          >
            <Mic className="w-5 h-5" /> Start Session
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-lg text-lg font-semibold animate-pulse"
          >
            <Square className="w-5 h-5" /> Stop Session
          </button>
        )}
      </div>
    </div>
  );
}
