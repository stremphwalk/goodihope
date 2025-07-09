import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, Check, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useGetSharedDotPhrase, useImportDotPhrase } from '@/hooks/useDotPhrases';
import type { CustomDotPhrase } from './DotPhraseManager';

interface ImportDotPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (importedPhrase: CustomDotPhrase) => void;
}

export function ImportDotPhraseModal({ isOpen, onClose, onSuccess }: ImportDotPhraseModalProps) {
  const [shareCode, setShareCode] = useState('');
  const [customTrigger, setCustomTrigger] = useState('');
  const [showCustomTrigger, setShowCustomTrigger] = useState(false);
  
  const normalizedShareCode = shareCode.toUpperCase().trim();
  const isValidCode = normalizedShareCode.length === 4 && /^[0-9A-Z]{4}$/.test(normalizedShareCode);
  
  const { data: sharedPhrase, isLoading: fetchingPhrase, error: fetchError } = useGetSharedDotPhrase(
    isValidCode ? normalizedShareCode : null
  );
  
  const importMutation = useImportDotPhrase();

  useEffect(() => {
    if (sharedPhrase && !showCustomTrigger) {
      setCustomTrigger(sharedPhrase.trigger);
    }
  }, [sharedPhrase, showCustomTrigger]);

  const handleImport = async () => {
    if (!sharedPhrase) return;
    
    try {
      const result = await importMutation.mutateAsync({
        shareCode: normalizedShareCode,
        customTrigger: showCustomTrigger ? customTrigger : undefined
      });
      
      onSuccess?.(result.dotPhrase);
      handleClose();
    } catch (error: any) {
      // Handle trigger conflict error
      if (error.message.includes('Trigger already exists')) {
        setShowCustomTrigger(true);
        // The error should contain suggestedTrigger, but we'll use a simple fallback
        if (!customTrigger.match(/\d+$/)) {
          setCustomTrigger(customTrigger + '1');
        }
      }
    }
  };

  const handleClose = () => {
    setShareCode('');
    setCustomTrigger('');
    setShowCustomTrigger(false);
    onClose();
  };

  const isImporting = importMutation.isPending;
  const canImport = sharedPhrase && customTrigger.startsWith('/') && customTrigger.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Dot Phrase
          </DialogTitle>
          <DialogDescription>
            Enter a 4-character share code to import a dot phrase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Code Input */}
          <div className="space-y-2">
            <Label htmlFor="shareCode">Share Code</Label>
            <Input
              id="shareCode"
              placeholder="e.g., A3X9"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase().slice(0, 4))}
              className="text-center font-mono text-lg tracking-wider"
              maxLength={4}
            />
            {shareCode && !isValidCode && (
              <div className="text-sm text-red-600 font-medium">
                Share code must be exactly 4 characters (letters and numbers)
              </div>
            )}
          </div>

          {/* Loading State */}
          {fetchingPhrase && (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-slate-600">Looking up share code...</div>
            </div>
          )}

          {/* Error State */}
          {fetchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {fetchError.message || 'Share code not found or is no longer available'}
              </AlertDescription>
            </Alert>
          )}

          {/* Shared Phrase Preview */}
          {sharedPhrase && (
            <div className="space-y-4">
              <Separator />
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="font-mono text-blue-600">{sharedPhrase.trigger}</span>
                    <Badge variant="outline">{sharedPhrase.category}</Badge>
                  </CardTitle>
                  {sharedPhrase.description && (
                    <CardDescription className="text-sm text-slate-600">
                      {sharedPhrase.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md max-h-32 overflow-y-auto border">
                    {sharedPhrase.content}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t text-sm text-slate-500">
                    <div>Imported {sharedPhrase.importCount || 0} times</div>
                    {sharedPhrase.sharedAt && (
                      <div>Shared {sharedPhrase.sharedAt.toLocaleDateString()}</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Trigger Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customTrigger">Trigger Command</Label>
                  {!showCustomTrigger && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomTrigger(true)}
                      className="text-xs h-6"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Customize
                    </Button>
                  )}
                </div>
                
                <Input
                  id="customTrigger"
                  value={customTrigger}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (!value.startsWith('/')) {
                      value = '/' + value.replace(/^\/+/, '');
                    }
                    setCustomTrigger(value);
                  }}
                  disabled={!showCustomTrigger}
                  className="font-mono"
                  placeholder="/trigger"
                />
                
                {showCustomTrigger && (
                  <div className="text-sm text-slate-600">
                    Customize the trigger if it conflicts with your existing dot phrases
                  </div>
                )}
              </div>

              {/* Import Button */}
              <Button 
                onClick={handleImport}
                disabled={!canImport || isImporting}
                className="w-full"
              >
                {isImporting ? 'Importing...' : 'Import Dot Phrase'}
              </Button>

              {/* Import Error */}
              {importMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {importMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Instructions */}
          {!sharedPhrase && !fetchingPhrase && !fetchError && (
            <Alert>
              <AlertDescription className="text-sm">
                <strong>How to import:</strong> Enter the 4-character code someone shared with you. 
                The dot phrase will be added to your collection.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}