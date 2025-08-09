import React, { useEffect, useRef, useState } from 'react';
import { Globe, Mic, MicOff, Copy, Trash2, Wifi, WifiOff, RefreshCw, ArrowLeftRight, Users } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type TranslationMode = 'one_way' | 'two_way';

interface Token {
  text: string;
  is_final: boolean;
  translation_status?: 'none' | 'original' | 'translation';
  language?: string;
  source_language?: string;
  speaker?: string;
}

interface ConversationEntry {
  id: string;
  speaker: 'Doctor' | 'Patient';
  originalText: string;
  originalLanguage: string;
  translatedText: string;
  translatedLanguage: string;
  timestamp: number;
  isComplete: boolean;
}

interface PartialTranscript {
  text: string;
  isTranslation: boolean;
  language: string;
  sourceLanguage?: string;
}

export default function LiveTranslationPage({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [doctorLanguage, setDoctorLanguage] = useState('en');
  const [patientLanguage, setPatientLanguage] = useState('fr');
  const [translationMode, setTranslationMode] = useState<TranslationMode>('two_way');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Partial<ConversationEntry> | null>(null);
  const [partialOriginal, setPartialOriginal] = useState('');
  const [partialTranslation, setPartialTranslation] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [enableSpeakerDiarization, setEnableSpeakerDiarization] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef<boolean>(false);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const { user } = useAuth();

  // Soniox WebSocket URL
  const SONIOX_WS_URL = 'wss://stt-rt.soniox.com/transcribe-websocket';

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, partialOriginal, partialTranslation]);

  // Fetch temporary API key from server
  const fetchTemporaryApiKey = async (): Promise<string> => {
    try {
      console.log('Requesting temporary Soniox API key...');
      
      const sessionId = `translation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare headers with authorization
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if user is authenticated
      if (user && user.id_token) {
        headers['Authorization'] = `Bearer ${user.id_token}`;
      }
      
      const response = await fetch('/api/transcription/token', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ 
          sessionId,
          usage: 'translation' // Indicate this is for translation
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get API key: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Temporary API key received', {
        expiresIn: data.expiresIn,
        keyPrefix: data.token?.substring(0, 12) + '...'
      });
      
      return data.token;
    } catch (error) {
      console.error('Failed to fetch temporary API key:', error);
      throw error;
    }
  };

  const startRecording = async () => {
    try {
      // First, get a temporary API key
      setStatus('connecting');
      let tempApiKey = apiKey;
      
      if (!tempApiKey) {
        try {
          tempApiKey = await fetchTemporaryApiKey();
          setApiKey(tempApiKey);
        } catch (error) {
          setStatus('error');
          alert('Failed to authenticate. Please ensure you are logged in.');
          return;
        }
      }

      // Get microphone access with proper constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      // Set up audio processing with correct sample rate
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      // Ensure audio context is running
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const source = audioContext.createMediaStreamSource(stream);

      // Connect to Soniox WebSocket
      const ws = new WebSocket(SONIOX_WS_URL);
      wsRef.current = ws;
      isProcessingRef.current = false;
      audioBufferRef.current = [];

      ws.onopen = () => {
        console.log('Connected to Soniox');
        setStatus('connected');

        // Send configuration based on translation mode
        const config: any = {
          api_key: tempApiKey,
          audio_format: 'pcm_s16le',
          sample_rate: 16000,
          num_channels: 1,
          model: 'stt-rt-preview',
          language_hints: [doctorLanguage, patientLanguage],
          enable_language_identification: true,
          enable_speaker_diarization: enableSpeakerDiarization
        };

        // Configure translation based on mode
        if (translationMode === 'two_way') {
          config.translation = {
            type: 'two_way',
            language_a: doctorLanguage,
            language_b: patientLanguage
          };
        } else {
          config.translation = {
            type: 'one_way',
            target_language: patientLanguage,
            source_languages: [doctorLanguage]
          };
        }

        console.log('Sending config for', translationMode, 'translation');
        ws.send(JSON.stringify(config));
        
        // Start audio processing after config is sent
        setTimeout(() => {
          isProcessingRef.current = true;
          setIsRecording(true);
          console.log('Audio processing started');
        }, 100);
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          
          if (response.error_code) {
            console.error('Soniox error:', response.error_code, response.error_message);
            
            // Handle specific error codes
            if (response.error_code === 'AUTH_ERROR' || response.error_code === 'INVALID_API_KEY') {
              // Clear the cached API key and try to get a new one
              setApiKey(null);
              alert('Authentication expired. Please try again.');
            } else if (response.error_code === 'AUDIO_DECODE_ERROR' || response.error_message?.includes('decode')) {
              console.error('Audio decode error - checking audio format');
              alert('Audio format error. Please refresh and try again.');
            } else {
              alert(`Error: ${response.error_message}`);
            }
            
            setStatus('error');
            stopRecording();
            return;
          }

          if (response.tokens && response.tokens.length > 0) {
            let hasOriginalText = false;
            let hasTranslationText = false;
            let originalText = '';
            let translationText = '';
            let detectedSpeaker = '';
            let originalLanguage = '';
            let translationLanguage = '';
            let sourceLanguage = '';
            
            // Process all tokens to build complete phrases
            response.tokens.forEach((token: Token) => {
              if (token.text) {
                if (token.translation_status === 'original' || !token.translation_status) {
                  originalText += token.text;
                  originalLanguage = token.language || '';
                  if (token.speaker) detectedSpeaker = token.speaker;
                  hasOriginalText = true;
                } else if (token.translation_status === 'translation') {
                  translationText += token.text;
                  translationLanguage = token.language || '';
                  sourceLanguage = token.source_language || '';
                  hasTranslationText = true;
                }
                
                // Update partial display for real-time feedback
                if (!token.is_final) {
                  if (token.translation_status === 'original' || !token.translation_status) {
                    setPartialOriginal(originalText);
                  } else if (token.translation_status === 'translation') {
                    setPartialTranslation(translationText);
                  }
                }
              }
            });
            
            // Only process final tokens to create conversation entries
            const hasFinalTokens = response.tokens.some((token: Token) => token.is_final && token.text?.trim());
            
            if (hasFinalTokens && (hasOriginalText || hasTranslationText)) {
              const speakerLabel = detectedSpeaker ? 
                (originalLanguage === doctorLanguage ? 'Doctor' : 'Patient') : 
                (originalLanguage === doctorLanguage ? 'Doctor' : 'Patient');
              
              setConversation(prev => {
                const entryId = `${Date.now()}_${Math.random()}`;
                const lastEntry = prev[prev.length - 1];
                
                // If we have both original and translation, create complete entry
                if (hasOriginalText && hasTranslationText) {
                  const newEntry: ConversationEntry = {
                    id: entryId,
                    speaker: speakerLabel,
                    originalText: originalText.trim(),
                    originalLanguage,
                    translatedText: translationText.trim(),
                    translatedLanguage: translationLanguage || (originalLanguage === doctorLanguage ? patientLanguage : doctorLanguage),
                    timestamp: Date.now(),
                    isComplete: true
                  };
                  
                  return [...prev, newEntry];
                }
                
                // If we only have original text, update or create entry
                if (hasOriginalText) {
                  if (lastEntry && !lastEntry.isComplete && lastEntry.speaker === speakerLabel) {
                    // Update existing entry with original text
                    return prev.map(entry => 
                      entry.id === lastEntry.id 
                        ? { ...entry, originalText: originalText.trim(), originalLanguage }
                        : entry
                    );
                  } else {
                    // Create new entry with original text only
                    const newEntry: ConversationEntry = {
                      id: entryId,
                      speaker: speakerLabel,
                      originalText: originalText.trim(),
                      originalLanguage,
                      translatedText: '',
                      translatedLanguage: translationLanguage || (originalLanguage === doctorLanguage ? patientLanguage : doctorLanguage),
                      timestamp: Date.now(),
                      isComplete: false
                    };
                    
                    return [...prev, newEntry];
                  }
                }
                
                // If we only have translation text, complete existing entry
                if (hasTranslationText && lastEntry && !lastEntry.isComplete) {
                  return prev.map(entry => 
                    entry.id === lastEntry.id 
                      ? { ...entry, translatedText: translationText.trim(), translatedLanguage: translationLanguage || (originalLanguage === doctorLanguage ? patientLanguage : doctorLanguage), isComplete: true }
                      : entry
                  );
                }
                
                return prev;
              });
              
              // Clear partial text when final tokens are processed
              setPartialOriginal('');
              setPartialTranslation('');
            }
          }

          if (response.finished) {
            console.log('Transcription finished');
            stopRecording();
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
        
        // Don't call stopRecording here to avoid infinite loop
        setIsRecording(false);
        isProcessingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log('Disconnected from Soniox', { code: event.code, reason: event.reason });
        setStatus('disconnected');
        setIsRecording(false);
        isProcessingRef.current = false;
      };

      // Use legacy ScriptProcessor as fallback (AudioWorklet requires HTTPS and proper setup)
      // Create a script processor node for audio processing
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      
      // Connect audio nodes
      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);
      
      // Process audio chunks
      let audioChunkBuffer: Float32Array[] = [];
      let chunkCount = 0;
      
      scriptProcessor.onaudioprocess = (e) => {
        if (!isProcessingRef.current || ws.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Buffer audio chunks to send larger packets (reduces network overhead)
        audioChunkBuffer.push(new Float32Array(inputData));
        chunkCount++;
        
        // Send every 3 chunks (approximately 240ms of audio)
        if (chunkCount >= 3) {
          // Combine chunks
          const totalLength = audioChunkBuffer.reduce((acc, chunk) => acc + chunk.length, 0);
          const combinedBuffer = new Float32Array(totalLength);
          let offset = 0;
          
          for (const chunk of audioChunkBuffer) {
            combinedBuffer.set(chunk, offset);
            offset += chunk.length;
          }
          
          // Convert to PCM16 and send
          const pcm16 = floatTo16BitPCM(combinedBuffer);
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(pcm16);
          }
          
          // Reset buffer
          audioChunkBuffer = [];
          chunkCount = 0;
        }
      };
      
      // Store processor reference for cleanup
      audioWorkletNodeRef.current = scriptProcessor as any;

    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setStatus('error');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Microphone permission denied. Please allow microphone access and try again.');
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert(`Failed to start recording: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    isProcessingRef.current = false;

    // Send empty message to signal end of stream
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('');
      setTimeout(() => {
        wsRef.current?.close();
      }, 100);
    }

    // Clean up audio resources
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setStatus('disconnected');
  };

  const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
    // Ensure we're converting properly for 16kHz sample rate
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      // Clamp the value between -1 and 1
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      
      // Convert to 16-bit PCM (little-endian as required by Soniox)
      // Scale and convert to signed 16-bit integer
      const sample = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, sample, true); // true = little-endian
    }
    
    return buffer;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text || '');
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setPartialOriginal('');
    setPartialTranslation('');
    setCurrentEntry(null);
  };

  const exportConversation = () => {
    const text = conversation.map(entry => {
      const doctorLang = getLanguageName(doctorLanguage);
      const patientLang = getLanguageName(patientLanguage);
      
      let result = `${entry.speaker}: ${entry.originalText}`;
      if (entry.translatedText) {
        result += `\n${entry.speaker === 'Doctor' ? 'Patient hears' : 'Doctor hears'}: ${entry.translatedText}`;
      }
      return result;
    }).join('\n\n');
    
    copyToClipboard(text);
    alert('Conversation copied to clipboard!');
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording]);

  // Clear API key after 50 minutes (before 1 hour expiry)
  useEffect(() => {
    if (apiKey) {
      const timer = setTimeout(() => {
        console.log('API key expired, clearing...');
        setApiKey(null);
      }, 50 * 60 * 1000); // 50 minutes

      return () => clearTimeout(timer);
    }
  }, [apiKey]);

  const StatusBadge = () => {
    const config = {
      connected: { color: 'bg-emerald-500', label: 'Connected', Icon: Wifi },
      connecting: { color: 'bg-amber-500', label: 'Connecting', Icon: RefreshCw },
      error: { color: 'bg-red-500', label: 'Error', Icon: WifiOff },
      disconnected: { color: 'bg-gray-400', label: 'Disconnected', Icon: WifiOff },
    }[status];

    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur border border-white/50 shadow-sm">
        <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
        <config.Icon className="w-4 h-4 opacity-80" />
        <span className="text-sm font-medium opacity-80">{config.label}</span>
      </div>
    );
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      en: 'English',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean'
    };
    return languages[code] || code.toUpperCase();
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
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Translation</h1>
                <p className="text-sm text-slate-600">Two-way conversation translation for medical consultations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge />
              {!user && (
                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Login required for translation
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-[1400px] mx-auto w-full px-6 pt-6">
          <div className="bg-white rounded-xl border border-black/5 p-5 shadow-sm mb-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Doctor Language */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  <Users className="inline w-3 h-3 mr-1" />
                  Doctor's Language
                </label>
                <select
                  value={doctorLanguage}
                  onChange={(e) => setDoctorLanguage(e.target.value)}
                  disabled={isRecording}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>

              {/* Translation Mode */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-slate-500" />
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setTranslationMode('two_way')}
                      disabled={isRecording}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        translationMode === 'two_way' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      } disabled:opacity-50`}
                    >
                      Two-Way
                    </button>
                    <button
                      onClick={() => setTranslationMode('one_way')}
                      disabled={isRecording}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        translationMode === 'one_way' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      } disabled:opacity-50`}
                    >
                      One-Way
                    </button>
                  </div>
                </div>
              </div>

              {/* Patient Language */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  <Users className="inline w-3 h-3 mr-1" />
                  Patient's Language
                </label>
                <select
                  value={patientLanguage}
                  onChange={(e) => setPatientLanguage(e.target.value)}
                  disabled={isRecording}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                >
                  <option value="fr">French</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>
            </div>

            {/* Speaker Diarization Toggle */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="speaker-diarization"
                  checked={enableSpeakerDiarization}
                  onChange={(e) => setEnableSpeakerDiarization(e.target.checked)}
                  disabled={isRecording}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <label htmlFor="speaker-diarization" className="text-sm text-slate-700">
                  Enable Speaker Separation (identifies who is speaking)
                </label>
              </div>

              <div className="text-xs text-slate-500">
                {translationMode === 'two_way' 
                  ? `Bi-directional: ${getLanguageName(doctorLanguage)} ⟷ ${getLanguageName(patientLanguage)}`
                  : `One-way: ${getLanguageName(doctorLanguage)} → ${getLanguageName(patientLanguage)}`
                }
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4">
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
                  disabled={!user}
                  title={!user ? 'Please login to use translation' : ''}
                >
                  <span className="relative flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <Mic className="w-4 h-4" /> Start Recording
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportConversation}
                disabled={conversation.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Copy className="w-4 h-4" /> Export
              </button>
              <button
                onClick={clearConversation}
                disabled={conversation.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            </div>
          </div>

          {!user && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Authentication Required:</strong> Please log in to use the live translation feature. 
                This ensures secure access to the translation service and protects your API usage.
              </p>
            </div>
          )}
        </div>

        {/* Conversation Display */}
        <div className="max-w-[1400px] mx-auto w-full px-6 py-6 pb-10 flex-1">
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm h-[calc(100vh-380px)] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Conversation</h2>
              <p className="text-xs text-slate-600">
                Real-time transcription and translation • 
                {enableSpeakerDiarization ? ' Speaker identification enabled' : ' Speaker identification disabled'}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {conversation.length === 0 && !partialOriginal && !partialTranslation ? (
                <div className="text-center text-slate-400 py-12">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ready for conversation...</p>
                  <p className="text-xs mt-2">Start speaking in {getLanguageName(doctorLanguage)} or {getLanguageName(patientLanguage)}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {conversation.map((entry) => (
                    <div key={entry.id} className="space-y-2">
                      {/* Original Message */}
                      <div className={`p-4 rounded-2xl max-w-[80%] ${
                        entry.speaker === 'Doctor' 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto shadow-md ring-1 ring-white/10' 
                          : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium opacity-75">
                            {entry.speaker} ({getLanguageName(entry.originalLanguage)})
                          </span>
                          <span className="text-xs opacity-50">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-base leading-relaxed">
                          {entry.originalText}
                        </p>
                      </div>
                      
                      {/* Translation */}
                      {entry.translatedText && (
                        <div className={`p-4 rounded-2xl max-w-[80%] ${
                          entry.speaker === 'Doctor'
                            ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-sm'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm ml-auto'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium opacity-75">
                              {entry.speaker === 'Doctor' ? 'Patient hears' : 'Doctor hears'}
                              <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-black/5">
                                {getLanguageName(entry.translatedLanguage)}
                              </span>
                            </span>
                          </div>
                          <p className="text-base leading-relaxed italic">
                            {entry.translatedText}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Show partial transcription in real-time */}
                  {(partialOriginal || partialTranslation) && (
                    <div className="space-y-2 opacity-60">
                      {partialOriginal && (
                        <div className="p-4 rounded-2xl max-w-[80%] bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse">
                          <div className="text-xs font-medium text-gray-600 mb-1">Speaking...</div>
                          <p className="text-base text-gray-800">{partialOriginal}</p>
                        </div>
                      )}
                      {partialTranslation && (
                        <div className="p-4 rounded-2xl max-w-[80%] border-2 border-dashed border-gray-300 bg-gray-50 ml-auto animate-pulse">
                          <div className="text-xs font-medium text-gray-600 mb-1">Translating...</div>
                          <p className="text-base text-gray-700 italic">{partialTranslation}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div ref={conversationEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}