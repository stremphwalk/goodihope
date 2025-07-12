// Convert ESM to CommonJS for Electron preload
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Cursor and position tracking
  getCursorPosition: (): Promise<{ x: number; y: number }> => ipcRenderer.invoke('get-cursor-position'),
  
  // Phrase expansion
  expandPhrase: (phraseData: any) => ipcRenderer.invoke('expand-phrase', phraseData),
  
  // Suggestion window control
  showSuggestion: (suggestions: any, position: any) =>
    ipcRenderer.invoke('show-suggestion', suggestions, position),
  hideSuggestion: () => ipcRenderer.invoke('hide-suggestion'),
  
  // Smart options handling
  completeSmartOptions: (expansionId: any, selections: any) =>
    ipcRenderer.invoke('complete-smart-options', expansionId, selections),
  cancelSmartOptions: (expansionId: any) =>
    ipcRenderer.invoke('cancel-smart-options', expansionId),
  
  // Event listeners
  onSlashPhraseDetected: (callback: any) => {
    ipcRenderer.on('slash-phrase-detected', (event: any, data: any) => callback(data));
  },
  
  onTextChange: (callback: any) => {
    ipcRenderer.on('text-change', (event: any, data: any) => callback(data));
  },
  
  onShowSmartOptions: (callback: any) => {
    ipcRenderer.on('show-smart-options', (event: any, data: any) => callback(data));
  },
  
  // Remove event listeners
  removeAllListeners: (channel: any) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Expose environment variables safely
console.log('Preload script environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID,
  REACT_APP_USER_POOL_CLIENT_ID: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  REACT_APP_OAUTH_DOMAIN: process.env.REACT_APP_OAUTH_DOMAIN
});

contextBridge.exposeInMainWorld('electronEnv', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  REACT_APP_USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID || '',
  REACT_APP_USER_POOL_CLIENT_ID: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
  REACT_APP_OAUTH_DOMAIN: process.env.REACT_APP_OAUTH_DOMAIN || ''
});