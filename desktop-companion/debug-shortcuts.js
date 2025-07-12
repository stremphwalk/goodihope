#!/usr/bin/env node

import { app, globalShortcut } from 'electron'

console.log('🔧 [DEBUG] Testing global shortcut registration...')

app.whenReady().then(() => {
  console.log('✅ [DEBUG] App is ready')
  
  const shortcuts = [
    'CommandOrControl+/',
    'CmdOrCtrl+/',
    'Command+/',
    'Ctrl+/'
  ]
  
  let registered = false
  
  for (const shortcut of shortcuts) {
    try {
      const success = globalShortcut.register(shortcut, () => {
        console.log(`🎯 [DEBUG] Shortcut triggered: ${shortcut}`)
      })
      
      if (success) {
        console.log(`✅ [DEBUG] Successfully registered: ${shortcut}`)
        registered = true
      } else {
        console.log(`❌ [DEBUG] Failed to register: ${shortcut}`)
      }
    } catch (error) {
      console.error(`💥 [DEBUG] Error registering ${shortcut}:`, error)
    }
  }
  
  if (registered) {
    console.log('🎉 [DEBUG] At least one shortcut was registered successfully!')
    console.log('Press Ctrl+C to exit')
  } else {
    console.log('❌ [DEBUG] No shortcuts could be registered!')
    console.log('This might be due to:')
    console.log('- macOS accessibility permissions not granted')
    console.log('- Another app using the same shortcut')
    console.log('- System restrictions')
    process.exit(1)
  }
})

app.on('window-all-closed', () => {
  app.quit()
}) 