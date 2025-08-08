import React, { useEffect, useRef, useState } from 'react';
import { Globe, Mic, MicOff } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';

interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

export default function LiveTranslationPage({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [sourceTranscript, setSourceTranscript] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Connect to backend WS
  useEffect(() => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/translate-ws`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.source_text) {
          setSourceTranscript((prev) => prev + ' ' + data.source_text);
        }
        if (data.translated_text) {
          setTranslatedTranscript((prev) => prev + ' ' + data.translated_text);
        }
      } catch {
        console.warn('Non-JSON message from WS', event.data);
      }
    };

    return () => {
      wsRef.current?.close();
    };
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
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (!isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const int16Data = floatTo16BitPCM(inputData);
        wsRef.current?.send(int16Data);
      };

      // Tell Soniox which languages to use
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
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
  };

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

  return (
    <MainLayout
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
      selectedSubOption={selectedSubOption}
      setSelectedSubOption={setSelectedSubOption}
      livePreview={null}
      hasLivePreview={false}
    >
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Globe className="w-8 h-8" /> Live Translation
        </h1>

        {/* Language selectors */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium">Source Language</label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="border rounded-lg p-2 shadow-sm"
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              {/* Add more languages as needed */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Target Language</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="border rounded-lg p-2 shadow-sm"
            >
              <option value="fr">French</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </div>
        </div>

        {/* Control buttons */}
        <div className="mb-6">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg flex items-center gap-2"
            >
              <MicOff className="w-5 h-5" /> Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2"
            >
              <Mic className="w-5 h-5" /> Start Recording
            </button>
          )}
        </div>

        {/* Two-column transcript view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-2xl p-4">
            <h2 className="font-semibold mb-2">Source Transcript</h2>
            <div className="h-64 overflow-y-auto whitespace-pre-wrap">{sourceTranscript}</div>
          </div>
          <div className="bg-white shadow-lg rounded-2xl p-4">
            <h2 className="font-semibold mb-2">Translated Transcript</h2>
            <div className="h-64 overflow-y-auto whitespace-pre-wrap">{translatedTranscript}</div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
