import React, { useState, useEffect } from 'react'
import { SettingsModal } from './SettingsModal'
import { useAuth } from './AuthProvider'

interface Settings {
  enableGlobalExpansion: boolean
  enableSuggestions: boolean
  suggestionDelay: number
  maxSuggestions: number
  autoStartWithSystem: boolean
  enableNotifications: boolean
  defaultDateFormat: 'short' | 'long' | 'iso'
  keyboardShortcut: string
}

const DEFAULT_SETTINGS: Settings = {
  enableGlobalExpansion: true,
  enableSuggestions: true,
  suggestionDelay: 300,
  maxSuggestions: 8,
  autoStartWithSystem: false,
  enableNotifications: true,
  defaultDateFormat: 'short',
  keyboardShortcut: 'Ctrl+Shift+A'
}

export function SystemTrayManager() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const { user, signOut } = useAuth()

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('arinote-companion-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    // Listen for system tray events from main process
    if (window.electronAPI) {
      // These would be implemented in the main process
      const handleTrayEvent = (event: string) => {
        switch (event) {
          case 'show-settings':
            setShowSettings(true)
            break
          case 'toggle-expansion':
            setSettings(prev => ({ 
              ...prev, 
              enableGlobalExpansion: !prev.enableGlobalExpansion 
            }))
            break
          case 'show-window':
            setIsMinimized(false)
            break
          case 'hide-window':
            setIsMinimized(true)
            break
        }
      }

      // Note: These event listeners would need to be properly implemented
      // in the main process and preload script
    }
  }, [])

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings)
    localStorage.setItem('arinote-companion-settings', JSON.stringify(newSettings))
    setShowSettings(false)

    // Send settings to main process
    if (window.electronAPI) {
      // This would send settings to the main process to update behavior
      console.log('Updating settings:', newSettings)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <>
      {/* Settings Modal */}
      <SettingsModal
        isVisible={showSettings}
        settings={settings}
        onSave={saveSettings}
        onCancel={() => setShowSettings(false)}
      />

      {/* System Status Indicator (when minimized to tray) */}
      {isMinimized && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="glass-morphism rounded-full p-3 shadow-lg">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      {!isMinimized && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="glass-morphism rounded-lg p-4 text-sm max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-900 font-medium">Quick Actions</div>
              <div className={`w-3 h-3 rounded-full ${
                settings.enableGlobalExpansion ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setShowSettings(true)}
                className="w-full text-left px-2 py-1 text-gray-700 hover:bg-white/50 rounded transition-colors"
              >
                ⚙️ Settings
              </button>
              
              <button
                onClick={() => setSettings(prev => ({ 
                  ...prev, 
                  enableGlobalExpansion: !prev.enableGlobalExpansion 
                }))}
                className="w-full text-left px-2 py-1 text-gray-700 hover:bg-white/50 rounded transition-colors"
              >
                {settings.enableGlobalExpansion ? '⏸️ Pause' : '▶️ Resume'} Expansion
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full text-left px-2 py-1 text-gray-700 hover:bg-white/50 rounded transition-colors"
              >
                🚪 Sign Out
              </button>
              
              <hr className="border-gray-200" />
              
              <div className="text-xs text-gray-600 space-y-1">
                <div>Status: {settings.enableGlobalExpansion ? 'Active' : 'Paused'}</div>
                <div>User: {user?.email || 'Unknown'}</div>
                <div>Suggestions: {settings.enableSuggestions ? 'On' : 'Off'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}