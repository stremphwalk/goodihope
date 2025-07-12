import { contextBridge, ipcRenderer } from 'electron'

// Expose methods for the suggestion window
contextBridge.exposeInMainWorld('suggestionAPI', {
  // Listen for suggestion updates
  onUpdateSuggestions: (callback: (suggestions: any[]) => void) => {
    ipcRenderer.on('update-suggestions', (event, suggestions) => callback(suggestions))
  },
  
  // Listen for dot phrase window events
  onShowDotPhraseWindow: (callback: (data: any) => void) => {
    ipcRenderer.on('show-dot-phrase-window', (event, data) => callback(data))
  },
  
  // Send selection back to main process
  selectSuggestion: (suggestion: any) => ipcRenderer.invoke('suggestion-selected', suggestion),
  
  // Close suggestions
  closeSuggestions: () => ipcRenderer.invoke('close-suggestions'),
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})

// Type declarations
declare global {
  interface Window {
    suggestionAPI: {
      onUpdateSuggestions: (callback: (suggestions: any[]) => void) => void
      onShowDotPhraseWindow: (callback: (data: any) => void) => void
      selectSuggestion: (suggestion: any) => void
      closeSuggestions: () => void
      removeAllListeners: (channel: string) => void
    }
  }
}