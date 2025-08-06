// @ts-nocheck
/**
 * Transcription Utilities for Medical Documentation
 * Handles context injection, text processing, and medical term optimization
 */

import englishTerms from './medicalTerms/english.js';
import frenchTerms from './medicalTerms/french.js';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  metadata?: any;
}

export interface SonioxContextConfig {
  context: string[];
  languageHints: string[];
  model: string;
}

export interface TextInsertionResult {
  text: string;
  cursorPosition: number;
}

/**
 * Sanitize transcription text to prevent injection attacks
 */
export function sanitizeTranscriptionText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Remove potentially dangerous characters and sequences
  let sanitized = text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:\s*/gi, '')
    // Remove data: URLs that could contain scripts
    .replace(/data\s*:\s*[^;]*;[^,]*,/gi, '')
    // Remove null bytes and control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Limit length to prevent DoS
    .slice(0, 5000);
  
  return sanitized.trim();
}

/**
 * Get medical context terms for a specific section and language
 */
export function getMedicalContext(section: string, language: string = 'en'): string[] {
  const terms = language === 'fr' ? frenchTerms : englishTerms;
  return terms.getContextualTerms(section);
}

/**
 * Create Soniox context configuration for medical transcription
 */
export function createMedicalContext(section: string, language: string = 'en', additionalTerms: string[] = []): SonioxContextConfig {
  const contextTerms = getMedicalContext(section, language);
  const allTerms = [...contextTerms, ...additionalTerms];
  
  // Limit context to most relevant terms (Soniox has limits)
  const limitedTerms = allTerms.slice(0, 200);
  
  return {
    context: limitedTerms,
    languageHints: [language],
    model: 'stt-rt-preview'
  };
}

/**
 * Detect the current medical section based on component or page context
 * @param {string} componentName - Name of the current component
 * @param {string} pathname - Current page pathname
 * @returns {string} Detected section identifier
 */
export function detectMedicalSection(componentName: string = '', pathname: string = ''): string {
  // Component-based detection
  if (componentName) {
    const lowerName = componentName.toLowerCase();
    if (lowerName.includes('hpi')) return 'hpi';
    if (lowerName.includes('chief') || lowerName.includes('complaint')) return 'chief-complaint';
    if (lowerName.includes('physical') || lowerName.includes('exam')) return 'physical-exam';
    if (lowerName.includes('lab') || lowerName.includes('laboratory')) return 'lab-results';
    if (lowerName.includes('medication')) return 'medications';
    if (lowerName.includes('pmh') || lowerName.includes('medical') && lowerName.includes('history')) return 'past-medical-history';
    if (lowerName.includes('impression') || lowerName.includes('assessment')) return 'impression';
    if (lowerName.includes('plan')) return 'plan';
  }
  
  // Pathname-based detection
  if (pathname) {
    const lowerPath = pathname.toLowerCase();
    if (lowerPath.includes('review-of-systems')) return 'hpi';
    if (lowerPath.includes('physical-exam')) return 'physical-exam';
    if (lowerPath.includes('lab')) return 'lab-results';
    if (lowerPath.includes('medication')) return 'medications';
  }
  
  // Default to general medical context
  return 'general';
}

/**
 * Process transcribed text for medical documentation
 * @param {string} text - Raw transcribed text
 * @param {string} language - Language code
 * @returns {string} Processed text with medical formatting
 */
export function processMedicalText(text: string, language: string = 'en'): any {
  if (!text) return '';
  
  let processedText = text.trim();
  
  // Capitalize first letter
  processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
  
  // Add period if missing and text is substantial
  if (processedText.length > 10 && !processedText.match(/[.!?]$/)) {
    processedText += '.';
  }
  
  // Expand common medical abbreviations
  const abbreviations = language === 'fr' 
    ? frenchTerms.medicalAbbreviations 
    : englishTerms.medicalAbbreviations;
  
  Object.entries(abbreviations).forEach(([abbrev, expansion]) => {
    const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
    processedText = processedText.replace(regex, expansion);
  });
  
  return processedText;
}

/**
 * Calculate confidence score for medical transcription
 * @param {Array} tokens - Transcription tokens with confidence scores
 * @param {string} section - Medical section for context-aware scoring
 * @returns {number} Overall confidence score (0-1)
 */
export function calculateMedicalConfidence(tokens: string[], section: string): number {
  if (!tokens || tokens.length === 0) return 0;
  
  const confidenceScores = tokens.map(token => token.confidence || 0);
  const averageConfidence = confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;
  
  // Boost confidence for recognized medical terms
  const text = tokens.map(token => token.text).join(' ').toLowerCase();
  const medicalTerms = getMedicalContext(section, 'en').concat(getMedicalContext(section, 'fr'));
  
  let medicalTermBoost = 0;
  let recognizedTerms = 0;
  
  medicalTerms.forEach(term => {
    if (text.includes(term.toLowerCase())) {
      recognizedTerms++;
      medicalTermBoost += 0.1; // Small boost per recognized term
    }
  });
  
  // Cap the boost at 0.2 (20% maximum boost)
  medicalTermBoost = Math.min(medicalTermBoost, 0.2);
  
  return Math.min(averageConfidence + medicalTermBoost, 1.0);
}

/**
 * Format transcription result for insertion into text fields
 * @param {string} existingText - Current text in the field
 * @param {string} newText - New transcribed text
 * @param {number} cursorPosition - Current cursor position
 * @returns {Object} Formatted result with text and cursor position
 */
export function formatTranscriptionForInsertion(existingText: string = '', newText: string = '', cursorPosition: number = 0): TextInsertionResult {
  if (!newText) return { text: existingText, cursorPosition };
  
  // Sanitize input to prevent injection attacks
  const sanitizedNewText = sanitizeTranscriptionText(newText);
  if (!sanitizedNewText) return { text: existingText, cursorPosition };
  
  const before = existingText.slice(0, cursorPosition);
  const after = existingText.slice(cursorPosition);
  
  // Add appropriate spacing
  let formattedText = sanitizedNewText;
  if (before && !before.endsWith(' ') && !before.endsWith('\n')) {
    formattedText = ' ' + formattedText;
  }
  if (after && !after.startsWith(' ') && !after.startsWith('\n') && formattedText && !formattedText.endsWith(' ')) {
    formattedText = formattedText + ' ';
  }
  
  const finalText = before + formattedText + after;
  const newCursorPosition = (before + formattedText).length;
  
  return {
    text: finalText,
    cursorPosition: newCursorPosition
  };
}

/**
 * Validate if transcription should be accepted based on confidence and content
 * @param {string} text - Transcribed text
 * @param {number} confidence - Confidence score
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateTranscription(text: string, confidence: number, options: any = {}): any {
  const {
    minConfidence = 0.7,
    minLength = 3,
    maxLength = 1000,
    allowProfanity = false
  } = options;
  
  const issues = [];
  
  if (!text || text.trim().length === 0) {
    issues.push('Empty transcription');
  }
  
  if (text && text.length < minLength) {
    issues.push(`Text too short (minimum ${minLength} characters)`);
  }
  
  if (text && text.length > maxLength) {
    issues.push(`Text too long (maximum ${maxLength} characters)`);
  }
  
  if (confidence < minConfidence) {
    issues.push(`Low confidence score (${Math.round(confidence * 100)}%)`);
  }
  
  // Basic profanity check (if not allowed)
  if (!allowProfanity && text) {
    const profanityWords = ['damn', 'shit', 'fuck', 'hell']; // Basic list
    const containsProfanity = profanityWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
    if (containsProfanity) {
      issues.push('Contains inappropriate language');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    confidence,
    processedText: text ? processMedicalText(text) : ''
  };
}

/**
 * Get appropriate keyboard shortcuts for transcription based on platform
 * @returns {Object} Keyboard shortcuts
 */
export function getTranscriptionShortcuts(): any[] {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  return {
    startStop: 'Space',
    cancel: 'Escape',
    accept: 'Enter',
    modifier: isMac ? 'Cmd' : 'Ctrl',
    platform: isMac ? 'mac' : 'pc'
  };
}

/**
 * Generate helpful transcription tips based on section and language
 * @param {string} section - Medical section
 * @param {string} language - Language code
 * @returns {Array} Array of helpful tips
 */
export function getTranscriptionTips(section: string, language: string = 'en'): any {
  const baseTips = language === 'en' ? [
    'Speak clearly and at a moderate pace',
    'Use medical terminology when appropriate',
    'Pause briefly between sentences',
    'Press Space to start/stop recording'
  ] : [
    'Parlez clairement et à un rythme modéré',
    'Utilisez la terminologie médicale appropriée',
    'Faites une pause brève entre les phrases',
    'Appuyez sur Espace pour démarrer/arrêter l\'enregistrement'
  ];
  
  const sectionTips = {
    'hpi': language === 'en' ? [
      'Describe symptoms with timing, quality, and severity',
      'Use OPQRST format when applicable'
    ] : [
      'Décrivez les symptômes avec la temporalité, la qualité et la sévérité',
      'Utilisez le format OPQRST quand applicable'
    ],
    
    'physical-exam': language === 'en' ? [
      'Use standard examination terminology',
      'Describe findings systematically by system'
    ] : [
      'Utilisez la terminologie d\'examen standard',
      'Décrivez les constatations systématiquement par système'
    ],
    
    'medications': language === 'en' ? [
      'Include drug name, dose, route, and frequency',
      'Spell out unusual drug names if needed'
    ] : [
      'Incluez le nom du médicament, la dose, la voie et la fréquence',
      'Épelez les noms de médicaments inhabituels si nécessaire'
    ]
  };
  
  return [...baseTips, ...(sectionTips[section] || [])];
}

export default {
  getMedicalContext,
  createMedicalContext,
  detectMedicalSection,
  processMedicalText,
  calculateMedicalConfidence,
  formatTranscriptionForInsertion,
  validateTranscription,
  getTranscriptionShortcuts,
  getTranscriptionTips
};