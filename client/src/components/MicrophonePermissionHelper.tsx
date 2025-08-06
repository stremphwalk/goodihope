// @ts-nocheck
/**
 * MicrophonePermissionHelper Component
 * Provides interactive troubleshooting for microphone permission issues
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { debugMicrophoneAccess, logBrowserInfo } from '@/lib/microphoneDebug';

export function MicrophonePermissionHelper() {
  const [isTestingPermission, setIsTestingPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'testing'>('unknown');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testMicrophoneAccess = async () => {
    setIsTestingPermission(true);
    setPermissionStatus('testing');
    
    try {
      console.log('🧪 Testing microphone access from helper...');
      const result = await debugMicrophoneAccess();
      setDebugInfo(result);
      
      if (result.success) {
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('Permission test failed:', error);
      setPermissionStatus('denied');
      setDebugInfo({ success: false, error: error.message });
    } finally {
      setIsTestingPermission(false);
    }
  };

  const resetAndRefresh = () => {
    // Clear any cached permission state
    localStorage.removeItem('microphone-permission-state');
    window.location.reload();
  };

  const getStatusIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">Permission Granted</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">Permission Denied</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Mic className="w-4 h-4" />
          Microphone Permission Troubleshooter
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Permission Status:</span>
          </div>
          {getStatusBadge()}
        </div>

        {debugInfo && (
          <div className="p-3 bg-white rounded border text-sm">
            <div className="font-medium mb-2">Debug Information:</div>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            onClick={testMicrophoneAccess}
            disabled={isTestingPermission}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isTestingPermission ? (
              <>
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Mic className="w-3 h-3 mr-2" />
                Test Permission
              </>
            )}
          </Button>

          <Button
            onClick={() => logBrowserInfo()}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <AlertTriangle className="w-3 h-3 mr-2" />
            Log Browser Info
          </Button>

          <Button
            onClick={resetAndRefresh}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Reset & Refresh
          </Button>
        </div>

        {permissionStatus === 'denied' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
            <div className="font-medium text-red-800 mb-2">🚨 Permission Denied - Try these solutions:</div>
            <ol className="list-decimal list-inside space-y-1 text-red-700">
              <li>Click the <strong>🔒 lock icon</strong> or <strong>🎤 microphone icon</strong> in your address bar</li>
              <li>Set <strong>"Microphone"</strong> to <strong>"Allow"</strong></li>
              <li>Click <strong>"Reset & Refresh"</strong> button above</li>
              <li>If that doesn't work, try clearing your browser cache</li>
            </ol>
          </div>
        )}

        {permissionStatus === 'granted' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
            <div className="font-medium text-green-800 mb-2">✅ Permission Granted!</div>
            <p className="text-green-700">
              Microphone access is working correctly. You should be able to use voice transcription now.
              If transcription still doesn't work, there may be an issue with the Soniox API connection.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MicrophonePermissionHelper;