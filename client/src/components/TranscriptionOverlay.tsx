// @ts-nocheck
/**
 * TranscriptionOverlay Component
 * Real-time transcription display with confidence scoring, manual correction,
 * and language switching controls for medical documentation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Check, 
  Edit3, 
  Volume2, 
  VolumeX, 
  Globe, 
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  Mic,
  Square,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMedicalTranscription } from '@/contexts/MedicalTranscriptionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TRANSCRIPTION_STATES } from '@/hooks/useSonioxTranscription';

/**
 * TranscriptionOverlay Component
 * @param {Object} props
 * @param {Object} props.transcription - Transcription hook instance
 * @param {Function} props.onAccept - Callback when transcription is accepted
 * @param {Function} props.onReject - Callback when transcription is rejected
 * @param {Function} props.onEdit - Callback when transcription is edited
 * @param {Function} props.onClose - Callback when overlay is closed
 * @param {boolean} props.isVisible - Whether overlay is visible
 * @param {string} props.position - Overlay position (top, bottom, center)
 * @param {boolean} props.showConfidence - Whether to show confidence scores
 * @param {boolean} props.allowEditing - Whether to allow manual editing
 * @param {boolean} props.showLanguageSwitch - Whether to show language switcher
 * @param {string} props.className - Additional CSS classes
 */
export function TranscriptionOverlay({
  transcription,
  onAccept,
  onReject,
  onEdit,
  onClose,
  isVisible = true,
  position = 'center',
  showConfidence = true,
  allowEditing = true,
  showLanguageSwitch = true,
  className
}) {
  const {
    getCurrentTips,
    getText,
    preferences,
    isGloballyEnabled
  } = useMedicalTranscription();

  const { language, setLanguage } = useLanguage();

  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const overlayRef = useRef(null);
  const editTextareaRef = useRef(null);

  // Destructure transcription state
  const {
    state,
    isRecording,
    currentTranscript,
    finalTranscript,
    confidence,
    error,
    duration,
    volume,
    startRecording,
    stopRecording,
    cancelRecording,
    canRecord
  } = transcription || {};

  // Update edited text when final transcript changes
  useEffect(() => {
    if (finalTranscript && !isEditing) {
      setEditedText(finalTranscript);
    }
  }, [finalTranscript, isEditing]);

  // Focus edit textarea when editing starts
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.select();
    }
  }, [isEditing]);

  // Handle accept transcription
  const handleAccept = useCallback(() => {
    const textToAccept = isEditing ? editedText : finalTranscript;
    if (textToAccept) {
      onAccept?.(textToAccept, {
        confidence,
        language,
        duration,
        wasEdited: isEditing,
        originalText: finalTranscript
      });
    }
    setIsEditing(false);
  }, [isEditing, editedText, finalTranscript, confidence, language, duration, onAccept]);

  // Handle reject transcription
  const handleReject = useCallback(() => {
    onReject?.({
      text: finalTranscript,
      confidence,
      language,
      duration
    });
    setIsEditing(false);
  }, [finalTranscript, confidence, language, duration, onReject]);

  // Handle edit toggle
  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      // Save edit
      onEdit?.(editedText, finalTranscript);
      setIsEditing(false);
    } else {
      // Start editing
      setIsEditing(true);
      setEditedText(finalTranscript || currentTranscript || '');
    }
  }, [isEditing, editedText, finalTranscript, currentTranscript, onEdit]);

  // Handle language switch
  const handleLanguageSwitch = useCallback(() => {
    const newLanguage = language === 'en' ? 'fr' : 'en';
    setLanguage(newLanguage);
  }, [language, setLanguage]);

  // Handle overlay close
  const handleClose = useCallback(() => {
    if (isRecording) {
      cancelRecording?.();
    }
    setIsEditing(false);
    onClose?.();
  }, [isRecording, cancelRecording, onClose]);

  // Get confidence color
  const getConfidenceColor = useCallback((conf) => {
    if (conf >= 0.8) return 'text-green-600 bg-green-100';
    if (conf >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }, []);

  // Get state display info
  const getStateInfo = useCallback(() => {
    switch (state) {
      case TRANSCRIPTION_STATES.CONNECTING:
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: 'Connecting...',
          color: 'text-blue-600'
        };
      
      case TRANSCRIPTION_STATES.LISTENING:
        return {
          icon: <Mic className="w-4 h-4 text-red-500 animate-pulse" />,
          text: getText('transcription.recording'),
          color: 'text-red-600'
        };
      
      case TRANSCRIPTION_STATES.PROCESSING:
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: getText('transcription.processing'),
          color: 'text-blue-600'
        };
      
      case TRANSCRIPTION_STATES.SUCCESS:
        return {
          icon: <Check className="w-4 h-4" />,
          text: getText('transcription.success'),
          color: 'text-green-600'
        };
      
      case TRANSCRIPTION_STATES.ERROR:
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: getText('transcription.error'),
          color: 'text-red-600'
        };
      
      default:
        return {
          icon: <Mic className="w-4 h-4" />,
          text: 'Ready',
          color: 'text-gray-600'
        };
    }
  }, [state, getText]);

  // Format duration
  const formatDuration = useCallback((ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
      : `${seconds}s`;
  }, []);

  const stateInfo = getStateInfo();
  const displayText = isEditing ? editedText : (finalTranscript || currentTranscript);
  const hasText = Boolean(displayText?.trim());

  if (!isVisible || !isGloballyEnabled) {
    return null;
  }

  return (
    <div 
      ref={overlayRef}
      className={cn(
        'fixed z-50 w-96 max-w-[90vw]',
        position === 'top' && 'top-4 left-1/2 transform -translate-x-1/2',
        position === 'bottom' && 'bottom-4 left-1/2 transform -translate-x-1/2',
        position === 'center' && 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
        className
      )}
    >
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {stateInfo.icon}
              <span className={stateInfo.color}>{stateInfo.text}</span>
            </CardTitle>
            
            <div className="flex items-center gap-1">
              {/* Language switcher */}
              {showLanguageSwitch && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLanguageSwitch}
                  className="h-6 w-6 p-0"
                  title={`Switch to ${language === 'en' ? 'French' : 'English'}`}
                >
                  <Globe className="w-3 h-3" />
                </Button>
              )}
              
              {/* Settings */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
                className="h-6 w-6 p-0"
              >
                <Settings className="w-3 h-3" />
              </Button>
              
              {/* Tips */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTips(!showTips)}
                className="h-6 w-6 p-0"
                title={getText('transcription.tips')}
              >
                ?
              </Button>
              
              {/* Close */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {/* Duration */}
              {duration > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(duration)}
                </div>
              )}
              
              {/* Confidence */}
              {showConfidence && confidence > 0 && (
                <Badge variant="outline" className={cn('text-xs', getConfidenceColor(confidence))}>
                  {Math.round(confidence * 100)}%
                </Badge>
              )}
              
              {/* Language */}
              <Badge variant="outline" className="text-xs">
                {language.toUpperCase()}
              </Badge>
            </div>
            
            {/* Volume indicator */}
            {isRecording && volume > 0 && (
              <div className="flex items-center gap-1">
                {volume > 20 ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <Progress value={Math.min(volume, 100)} className="w-12 h-1" />
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Error display */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error.message || 'Transcription error'}
              </div>
            </div>
          )}
          
          {/* Transcription display/edit */}
          <div className="mb-3">
            {isEditing ? (
              <Textarea
                ref={editTextareaRef}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder="Edit transcription..."
                className="min-h-[80px] text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleAccept();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
              />
            ) : (
              <div className={cn(
                'min-h-[80px] p-3 border rounded bg-gray-50 text-sm',
                !hasText && 'text-gray-400 italic',
                state === TRANSCRIPTION_STATES.LISTENING && 'bg-blue-50 border-blue-200'
              )}>
                {displayText || 'Speak to start transcription...'}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Record control */}
              {canRecord && !isRecording && (
                <Button size="sm" onClick={startRecording} variant="outline">
                  <Mic className="w-4 h-4 mr-1" />
                  Start
                </Button>
              )}
              
              {isRecording && (
                <Button size="sm" onClick={stopRecording} variant="outline">
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              )}
              
              {/* Edit button */}
              {allowEditing && hasText && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditToggle}
                  className={cn(isEditing && 'bg-blue-100')}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {isEditing ? 'Save' : 'Edit'}
                </Button>
              )}
            </div>
            
            {/* Accept/Reject buttons */}
            {hasText && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleReject}>
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button size="sm" onClick={handleAccept}>
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
              </div>
            )}
          </div>
          
          {/* Tips display */}
          {showTips && (
            <>
              <Separator className="my-3" />
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-2">{getText('transcription.tips')}:</div>
                <ul className="space-y-1">
                  {getCurrentTips().map((tip, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-gray-400 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          
          {/* Settings display */}
          {showSettings && (
            <>
              <Separator className="my-3" />
              <div className="text-xs text-gray-600 space-y-2">
                <div className="font-medium">Settings:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">Confidence</label>
                    <div className="text-sm">{Math.round(preferences.confidence * 100)}%</div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Auto-insert</label>
                    <div className="text-sm">{preferences.autoInsert ? 'On' : 'Off'}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Minimal TranscriptionOverlay for compact display
 */
export function TranscriptionOverlayCompact(props) {
  return (
    <TranscriptionOverlay
      showConfidence={false}
      allowEditing={false}
      showLanguageSwitch={false}
      className="w-80"
      {...props}
    />
  );
}

/**
 * Full-featured TranscriptionOverlay for detailed control
 */
export function TranscriptionOverlayFull(props) {
  return (
    <TranscriptionOverlay
      showConfidence={true}
      allowEditing={true}
      showLanguageSwitch={true}
      className="w-[28rem]"
      {...props}
    />
  );
}

export default TranscriptionOverlay;