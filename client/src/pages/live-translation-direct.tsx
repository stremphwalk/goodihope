import React, { useEffect, useRef, useState } from 'react';
import { Globe, Mic, MicOff, Copy, Trash2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';

interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

// Direct Soniox connection - no backend proxy needed
const SONIOX_API_KEY = '9b26f4f5b6814d102027465c700ab916132fb269f7489607bb7b956ad3ebe877';

export default function LiveTranslationDirectPage({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [sourceTranscript, setSourceTranscript] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Connect directly to Soniox
  useEffect(() => {
    try {
      setWsStatus('connecting');
      const ws = new WebSocket('wss://api.soniox.com/translate-realtime');
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('open');
        // Send authentication immediately after connection
        ws.send(JSON.stringify({
          api_key: SONIOX_API_KEY
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.source_text) {
            setSourceTranscript((prev) => (prev ? prev + ' ' : '') + data.source_text);
          }
          if (data.translated_text) {
            setTranslatedTranscript((prev) => (prev ? prev + ' ' : '') + data.translated_text);
          }
        } catch {
          // Non-JSON message
        }
      };

      ws.onerror = () => setWsStatus('error');
      ws.onclose = () => setWsStatus('closed');

      return () => {
        ws.close();
      };
    } catch (e) {
      setWsStatus('error');
    }
  }, []);

  const startRecording = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('WebSocket is not connected yet.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (!isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const int16Data = floatTo16BitPCM(inputData);
        wsRef.current?.send(int16Data);
      };

      // Send language configuration
      wsRef.current.send(
        JSON.stringify({
          command: 'config',
          source_language: sourceLanguage,
          target_language: targetLanguage,
        })
      );

      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording', err);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopRecording();
      wsRef.current?.close();
    };
  }, []);

  const floatTo16BitPCM = (float32Array: Float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text || '');
    } catch (e) {
      // no-op
    }
  };

  const clearTranscripts = () => {
    setSourceTranscript('');
    setTranslatedTranscript('');
  };

  const reconnect = () => {
    try {
      wsRef.current?.close();
    } catch {}
    // Create a new connection
    setWsStatus('connecting');
    const ws = new WebSocket('wss://api.soniox.com/translate-realtime');
    wsRef.current = ws;
    ws.onopen = () => {
      setWsStatus('open');
      // Send authentication
      ws.send(JSON.stringify({
        api_key: SONIOX_API_KEY
      }));
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.source_text) setSourceTranscript((prev) => (prev ? prev + ' ' : '') + data.source_text);
        if (data.translated_text) setTranslatedTranscript((prev) => (prev ? prev + ' ' : '') + data.translated_text);
      } catch {}
    };
    ws.onerror = () => setWsStatus('error');
    ws.onclose = () => setWsStatus('closed');
  };

  const StatusBadge = () => {
    const color = wsStatus === 'open' ? 'bg-emerald-500' : wsStatus === 'connecting' ? 'bg-amber-500' : wsStatus === 'error' ? 'bg-red-500' : 'bg-gray-400';
    const label = wsStatus === 'open' ? 'Connected' : wsStatus === 'connecting' ? 'Connecting' : wsStatus === 'error' ? 'Error' : 'Closed';
    const Icon = wsStatus === 'open' ? Wifi : wsStatus === 'connecting' ? RefreshCw : WifiOff;
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur border border-white/50 shadow-sm">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <Icon className="w-4 h-4 opacity-80" />
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
    );
  };

  return (
    <MainLayout
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
      selectedSubOption={selectedSubOption}
      setSelectedSubOption={setSelectedSubOption}
      livePreview={null}
      hasLivePreview={false}
    >
      <div className="flex flex-col h-full min-h-screen bg-gradient-to-br from-[#F7F7F2] via-[#F2F9FF] to-[#F7F2FF]">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-black/5 bg-white/70 backdrop-blur">
          <div className="w-full px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Translation (Direct)</h1>
                <p className="text-sm text-slate-600">Direct connection to Soniox - no backend needed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge />
              {wsStatus !== 'open' && (
                <button onClick={reconnect} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-500">
                  <RefreshCw className="w-4 h-4" /> Reconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-[1400px] mx-auto w-full px-6 pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-black/5 p-4 shadow-sm">
                <label className="block text-xs font-medium text-slate-600 mb-1">Source Language</label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
              <div className="bg-white rounded-xl border border-black/5 p-4 shadow-sm">
                <label className="block text-xs font-medium text-slate-600 mb-1">Target Language</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="fr">French</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-red-600 text-white shadow-md hover:bg-red-500"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <MicOff className="w-4 h-4" /> Stop Recording
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-500 disabled:opacity-60"
                  disabled={wsStatus !== 'open'}
                >
                  <span className="relative flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <Mic className="w-4 h-4" /> Start Recording
                </button>
              )}
              <button
                onClick={clearTranscripts}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-black/5 text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1400px] mx-auto w-full px-6 py-6 pb-10 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-220px)]">
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Source Transcript</h2>
                  <p className="text-xs text-slate-600">Live speech recognition in the source language</p>
                </div>
                <button onClick={() => copyToClipboard(sourceTranscript)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100">
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="whitespace-pre-wrap text-slate-800 leading-6 text-[15px]">
                  {sourceTranscript || <span className="text-slate-400">Waiting for audio…</span>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Translated Transcript</h2>
                  <p className="text-xs text-slate-600">Realtime translation into the target language</p>
                </div>
                <button onClick={() => copyToClipboard(translatedTranscript)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100">
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="whitespace-pre-wrap text-slate-800 leading-6 text-[15px]">
                  {translatedTranscript || <span className="text-slate-400">Awaiting translation…</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}