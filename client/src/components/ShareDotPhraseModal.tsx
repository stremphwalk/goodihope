import React, { useState } from 'react';
import { Copy, Check, Share2, ExternalLink, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useShareDotPhrase } from '@/hooks/useDotPhrases';
import type { CustomDotPhrase } from './DotPhraseManager';

interface ShareDotPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dotPhrase: CustomDotPhrase;
}

export function ShareDotPhraseModal({ isOpen, onClose, dotPhrase }: ShareDotPhraseModalProps) {
  const [copied, setCopied] = useState(false);
  const shareMutation = useShareDotPhrase();

  const handleShare = async () => {
    try {
      await shareMutation.mutateAsync(dotPhrase.id);
    } catch (error) {
      console.error('Failed to share dot phrase:', error);
    }
  };

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareCode = dotPhrase.shareCode || shareMutation.data?.shareCode;
  const isPublic = dotPhrase.isPublic || shareMutation.data?.isPublic;
  const importCount = dotPhrase.importCount || shareMutation.data?.importCount || 0;
  const sharedAt = dotPhrase.sharedAt || shareMutation.data?.sharedAt;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Dot Phrase
          </DialogTitle>
          <DialogDescription>
            Share "{dotPhrase.trigger}" with other users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dot Phrase Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="font-mono text-blue-600">{dotPhrase.trigger}</span>
                <Badge variant="outline">{dotPhrase.category}</Badge>
              </CardTitle>
              {dotPhrase.description && (
                <CardDescription className="text-xs">
                  {dotPhrase.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                {dotPhrase.content.length > 100 
                  ? `${dotPhrase.content.substring(0, 100)}...`
                  : dotPhrase.content
                }
              </div>
            </CardContent>
          </Card>

          <Separator />

          {!shareCode && !shareMutation.data ? (
            /* Generate Share Code Section */
            <div className="space-y-3">
              <Alert>
                <Share2 className="h-4 w-4" />
                <AlertDescription>
                  Generate a unique 4-character code to share this dot phrase with others.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleShare} 
                disabled={shareMutation.isPending}
                className="w-full"
              >
                {shareMutation.isPending ? 'Generating...' : 'Generate Share Code'}
              </Button>
            </div>
          ) : (
            /* Share Code Display Section */
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Share Code</div>
                <div className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 py-2 px-4 rounded border">
                  {shareCode}
                </div>
              </div>

              {/* Copy Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyCode(shareCode!)}
                  className="flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleCopyCode(`Import this dot phrase: ${shareCode}`)}
                  className="flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Copy Message
                </Button>
              </div>

              {/* Share Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Imported {importCount} times</span>
                </div>
                {sharedAt && (
                  <div className="text-xs">
                    Shared {sharedAt.toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>How to share:</strong> Send the code "{shareCode}" to other users. 
                  They can import it using the Import feature in their Dot Phrase Manager.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {shareMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {shareMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}