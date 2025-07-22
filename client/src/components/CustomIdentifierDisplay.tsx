import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Copy, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from 'react-oidc-context';

interface CustomIdentifierData {
  customIdentifier: string;
  formattedIdentifier: string;
  isNew?: boolean;
}

export function CustomIdentifierDisplay() {
  const [identifierData, setIdentifierData] = useState<CustomIdentifierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const fetchIdentifier = async () => {
    if (!auth.user?.id_token || !auth.isAuthenticated) {
      console.log('[DEBUG] CustomIdentifierDisplay: Not authenticated, skipping fetchIdentifier');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/user/identifier', {
        headers: {
          'Authorization': `Bearer ${auth.user.id_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch identifier');
      }

      const data = await response.json();
      setIdentifierData(data);
    } catch (error) {
      console.error('Error fetching identifier:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your custom identifier",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const copyToClipboard = async () => {
    if (!identifierData?.customIdentifier) return;

    try {
      await navigator.clipboard.writeText(identifierData.customIdentifier);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Custom identifier copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy identifier",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id_token) {
      fetchIdentifier();
    } else {
      setLoading(false);
    }
  }, [auth.isAuthenticated, auth.user?.id_token]);

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Custom Identifier</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!identifierData) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Custom Identifier</CardTitle>
          <CardDescription>Unable to load identifier</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          User ID
          {identifierData.isNew && (
            <Badge variant="secondary" className="text-xs">New</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Your permanent user identifier for team collaboration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold text-primary">
              {identifierData.formattedIdentifier}
            </span>
            {copied && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            disabled={copied}
            className="ml-2"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Share this permanent ID with team members</p>
          <p>• Use it for team collaboration</p>
          <p>• Your unique identifier for professional documentation</p>
        </div>
      </CardContent>
    </Card>
  );
} 