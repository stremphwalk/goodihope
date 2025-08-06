// @ts-nocheck
/**
 * Audio Analysis Utilities
 * Real-time audio level analysis for waveform visualization
 */

export interface AudioLevelData {
  volume: number;
  frequency: number;
  waveform: number[];
  peak: number;
  average: number;
}

export class AudioLevelAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrame: number | null = null;
  private isActive = false;
  
  // Configuration
  private readonly FFT_SIZE = 256;
  private readonly SMOOTHING = 0.8;
  private readonly MIN_DECIBELS = -90;
  private readonly MAX_DECIBELS = -10;
  
  // Callbacks
  private onLevelUpdate: ((data: AudioLevelData) => void) | null = null;
  
  constructor() {
    this.setupAudioContext();
  }
  
  /**
   * Initialize audio context and analyser
   */
  private setupAudioContext(): void {
    try {
      // Create audio context with better browser support
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!AudioContextClass) {
        console.warn('Web Audio API not supported');
        return;
      }
      
      this.audioContext = new AudioContextClass();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;
      this.analyser.smoothingTimeConstant = this.SMOOTHING;
      this.analyser.minDecibels = this.MIN_DECIBELS;
      this.analyser.maxDecibels = this.MAX_DECIBELS;
      
      // Create data array for frequency data
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
    } catch (error) {
      console.warn('Failed to setup audio context:', error);
    }
  }
  
  /**
   * Start audio analysis with microphone input
   */
  async startAnalysis(stream: MediaStream): Promise<boolean> {
    if (!this.audioContext || !this.analyser || this.isActive) {
      return false;
    }
    
    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Store stream reference
      this.stream = stream;
      
      // Create audio source from stream
      this.source = this.audioContext.createMediaStreamSource(stream);
      
      // Connect source to analyser
      this.source.connect(this.analyser);
      
      // Start analysis loop
      this.isActive = true;
      this.analyzeAudio();
      
      return true;
    } catch (error) {
      console.error('Failed to start audio analysis:', error);
      return false;
    }
  }
  
  /**
   * Stop audio analysis
   */
  stopAnalysis(): void {
    this.isActive = false;
    
    // Cancel animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Disconnect audio nodes
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    // Clear stream reference
    this.stream = null;
  }
  
  /**
   * Main audio analysis loop
   */
  private analyzeAudio(): void {
    if (!this.isActive || !this.analyser || !this.dataArray) {
      return;
    }
    
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate audio metrics
    const audioData = this.calculateAudioMetrics(this.dataArray);
    
    // Call update callback
    if (this.onLevelUpdate) {
      this.onLevelUpdate(audioData);
    }
    
    // Schedule next frame
    this.animationFrame = requestAnimationFrame(() => this.analyzeAudio());
  }
  
  /**
   * Calculate audio metrics from frequency data
   */
  private calculateAudioMetrics(frequencyData: Uint8Array): AudioLevelData {
    const length = frequencyData.length;
    
    // Calculate volume (RMS)
    let sum = 0;
    let peak = 0;
    
    for (let i = 0; i < length; i++) {
      const value = frequencyData[i];
      sum += value * value;
      peak = Math.max(peak, value);
    }
    
    const rms = Math.sqrt(sum / length);
    const volume = (rms / 255) * 100; // Convert to percentage
    const average = sum / length / 255 * 100;
    
    // Calculate dominant frequency
    let maxIndex = 0;
    let maxValue = 0;
    
    for (let i = 1; i < length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }
    
    // Convert bin index to frequency (approximate)
    const nyquist = (this.audioContext?.sampleRate || 44100) / 2;
    const frequency = (maxIndex / length) * nyquist;
    
    // Generate waveform data (simplified visualization)
    const waveform = this.generateWaveformData(frequencyData);
    
    return {
      volume: Math.round(volume * 100) / 100,
      frequency: Math.round(frequency),
      waveform,
      peak: (peak / 255) * 100,
      average: Math.round(average * 100) / 100
    };
  }
  
  /**
   * Generate waveform data for visualization
   */
  private generateWaveformData(frequencyData: Uint8Array): number[] {
    const waveformLength = 32; // Number of bars in waveform
    const chunkSize = Math.floor(frequencyData.length / waveformLength);
    const waveform: number[] = [];
    
    for (let i = 0; i < waveformLength; i++) {
      let chunkSum = 0;
      const startIndex = i * chunkSize;
      const endIndex = Math.min(startIndex + chunkSize, frequencyData.length);
      
      for (let j = startIndex; j < endIndex; j++) {
        chunkSum += frequencyData[j];
      }
      
      const average = chunkSum / (endIndex - startIndex);
      waveform.push((average / 255) * 100);
    }
    
    return waveform;
  }
  
  /**
   * Set callback for audio level updates
   */
  setLevelUpdateCallback(callback: (data: AudioLevelData) => void): void {
    this.onLevelUpdate = callback;
  }
  
  /**
   * Remove callback
   */
  removeLevelUpdateCallback(): void {
    this.onLevelUpdate = null;
  }
  
  /**
   * Get current audio context state
   */
  getState(): string {
    return this.audioContext?.state || 'closed';
  }
  
  /**
   * Check if analysis is currently active
   */
  isAnalysisActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAnalysis();
    
    if (this.audioContext) {
      this.audioContext.close().catch(console.warn);
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
  }
}

/**
 * Utility function to create and manage audio analyzer
 */
export function createAudioAnalyzer(): AudioLevelAnalyzer {
  return new AudioLevelAnalyzer();
}

/**
 * Get microphone stream with audio constraints optimized for analysis
 */
export async function getOptimizedMicrophoneStream(): Promise<MediaStream | null> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia not supported');
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Advanced constraints for better audio analysis
        sampleRate: 44100,
        channelCount: 1,
        sampleSize: 16,
      }
    });
    
    return stream;
  } catch (error) {
    console.error('Failed to get microphone stream:', error);
    return null;
  }
}

/**
 * Simple volume detector for basic level monitoring
 */
export class SimpleVolumeDetector {
  private analyser: AudioLevelAnalyzer;
  private currentVolume = 0;
  private threshold = 10; // Minimum volume threshold
  
  constructor() {
    this.analyser = new AudioLevelAnalyzer();
    
    // Set up volume monitoring
    this.analyser.setLevelUpdateCallback((data) => {
      this.currentVolume = data.volume;
    });
  }
  
  /**
   * Start volume detection
   */
  async start(): Promise<boolean> {
    const stream = await getOptimizedMicrophoneStream();
    if (!stream) return false;
    
    return this.analyser.startAnalysis(stream);
  }
  
  /**
   * Stop volume detection
   */
  stop(): void {
    this.analyser.stopAnalysis();
  }
  
  /**
   * Get current volume level
   */
  getCurrentVolume(): number {
    return this.currentVolume;
  }
  
  /**
   * Check if speaking is detected
   */
  isSpeaking(): boolean {
    return this.currentVolume > this.threshold;
  }
  
  /**
   * Set volume threshold for speech detection
   */
  setThreshold(threshold: number): void {
    this.threshold = Math.max(0, Math.min(100, threshold));
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.analyser.dispose();
  }
}