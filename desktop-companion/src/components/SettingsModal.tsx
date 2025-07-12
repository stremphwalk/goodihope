import React, { useState } from 'react'

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

interface SettingsModalProps {
  isVisible: boolean
  settings: Settings
  onSave: (settings: Settings) => void
  onCancel: () => void
}

export function SettingsModal({ 
  isVisible, 
  settings, 
  onSave, 
  onCancel 
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings)

  React.useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = () => {
    onSave(localSettings)
  }

  const updateSetting = <K extends keyof Settings>(
    key: K, 
    value: Settings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Core Functionality */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Core Functionality</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.enableGlobalExpansion}
                    onChange={(e) => updateSetting('enableGlobalExpansion', e.target.checked)}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Enable Global Text Expansion</span>
                    <p className="text-xs text-gray-500">Allow dot phrase expansion in all applications</p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.enableSuggestions}
                    onChange={(e) => updateSetting('enableSuggestions', e.target.checked)}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Show Suggestions</span>
                    <p className="text-xs text-gray-500">Display floating suggestion panels</p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.enableNotifications}
                    onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Enable Notifications</span>
                    <p className="text-xs text-gray-500">Show system notifications for phrase expansions</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Suggestion Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Suggestions</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suggestion Delay (ms)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="100"
                    value={localSettings.suggestionDelay}
                    onChange={(e) => updateSetting('suggestionDelay', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {localSettings.suggestionDelay}ms delay before showing suggestions
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Suggestions
                  </label>
                  <select
                    value={localSettings.maxSuggestions}
                    onChange={(e) => updateSetting('maxSuggestions', parseInt(e.target.value))}
                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={3}>3 suggestions</option>
                    <option value={5}>5 suggestions</option>
                    <option value={8}>8 suggestions</option>
                    <option value={10}>10 suggestions</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Date Format</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Date Format
                </label>
                <select
                  value={localSettings.defaultDateFormat}
                  onChange={(e) => updateSetting('defaultDateFormat', e.target.value as 'short' | 'long' | 'iso')}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="short">Short (12/25/2023)</option>
                  <option value="long">Long (Monday, December 25, 2023)</option>
                  <option value="iso">ISO (2023-12-25)</option>
                </select>
              </div>
            </div>

            {/* System Integration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">System Integration</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.autoStartWithSystem}
                    onChange={(e) => updateSetting('autoStartWithSystem', e.target.checked)}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Start with System</span>
                    <p className="text-xs text-gray-500">Automatically start AriNote Companion when system boots</p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Global Shortcut
                  </label>
                  <input
                    type="text"
                    value={localSettings.keyboardShortcut}
                    onChange={(e) => updateSetting('keyboardShortcut', e.target.value)}
                    placeholder="e.g., Ctrl+Shift+A"
                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Keyboard shortcut to show/hide the main window
                  </div>
                </div>
              </div>
            </div>

            {/* App Info */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">About</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>AriNote Companion</strong> v1.0.0</p>
                <p>System-wide dot phrase expansion for AriNote</p>
                <p className="text-xs text-gray-500 mt-2">
                  Built with Electron, React, and modern web technologies
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}