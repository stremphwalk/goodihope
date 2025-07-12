import { EventEmitter } from 'events'
import { screen, globalShortcut, app } from 'electron'

export class GlobalKeyboardListener extends EventEmitter {
  private isListening = false
  private currentText = ''
  private lastKeystroke = 0
  private textBuffer: string[] = []
  private maxBufferSize = 50 // Reduced buffer size for memory efficiency
  private isThrottled = false
  private throttleDelay = 16 // ~60fps for smooth performance
  private cleanupInterval: NodeJS.Timeout | null = null
  private eventQueue: Array<() => void> = []
  private isProcessingQueue = false

  constructor() {
    super()
    this.startListening()
    this.initializeOptimizations()
  }

  private initializeOptimizations() {
    // Periodic cleanup to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, 30000) // Every 30 seconds

    // Process event queue in batches for better performance
    this.processEventQueue()
  }

  private performCleanup() {
    const now = Date.now()
    
    // Clear old text buffer if no activity
    if (now - this.lastKeystroke > 10000) { // 10 seconds of inactivity
      this.textBuffer = []
      this.currentText = ''
    }

    // Force garbage collection if available
    if (global.gc && this.textBuffer.length > 30) {
      global.gc()
    }
  }

  private processEventQueue() {
    if (this.isProcessingQueue || this.eventQueue.length === 0) {
      setTimeout(() => this.processEventQueue(), this.throttleDelay)
      return
    }

    this.isProcessingQueue = true
    const batchSize = Math.min(5, this.eventQueue.length) // Process max 5 events per batch
    
    for (let i = 0; i < batchSize; i++) {
      const event = this.eventQueue.shift()
      if (event) {
        try {
          event()
        } catch (error) {
          console.error('Error processing keyboard event:', error)
        }
      }
    }

    this.isProcessingQueue = false
    setTimeout(() => this.processEventQueue(), this.throttleDelay)
  }

  private queueEvent(eventHandler: () => void) {
    if (this.eventQueue.length < 50) { // Prevent queue overflow
      this.eventQueue.push(eventHandler)
    }
  }

  private startListening() {
    if (this.isListening) return
    
    this.isListening = true
    
    console.log('Keyboard listener started (dot phrase mode)')
    
    // Wait for app to be ready before registering shortcuts
    if (!app.isReady()) {
      app.whenReady().then(() => {
        this.registerShortcuts()
      })
    } else {
      this.registerShortcuts()
    }
  }

  private registerShortcuts() {
    // Try multiple shortcut variations for better compatibility
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
          console.log(`⌨️ [KEYBOARD] Shortcut triggered: ${shortcut}`)
          this.showDotPhraseWindow()
        })
        
        if (success) {
          console.log(`✅ [KEYBOARD] Successfully registered shortcut: ${shortcut}`)
          registered = true
          break
        } else {
          console.warn(`⚠️ [KEYBOARD] Failed to register shortcut: ${shortcut}`)
        }
      } catch (error) {
        console.error(`❌ [KEYBOARD] Error registering shortcut ${shortcut}:`, error)
      }
    }
    
    if (!registered) {
      console.error('❌ [KEYBOARD] Failed to register any shortcuts!')
      console.log('🔧 [KEYBOARD] This might be due to:')
      console.log('   - macOS accessibility permissions not granted')
      console.log('   - Another app using the same shortcut')
      console.log('   - System restrictions')
      
      // Show a notification to the user about permissions
      this.emit('shortcutRegistrationFailed', {
        message: 'Please grant accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility',
        platform: process.platform
      })
    }
  }

  private async showDotPhraseWindow() {
    try {
      console.log('🚀 [KEYBOARD] showDotPhraseWindow called')
      console.log('📊 [KEYBOARD] Current app state:', {
        isListening: this.isListening,
        eventQueueLength: this.eventQueue.length,
        isProcessingQueue: this.isProcessingQueue
      })
      
      // Get current text cursor position
      const position = await this.getCursorPosition()
      
      console.log('📍 [KEYBOARD] Text cursor position detected:', position)
      
      const eventData = {
        position,
        trigger: 'manual',
        timestamp: Date.now()
      }
      
      console.log('📡 [KEYBOARD] Emitting showDotPhraseWindow event:', eventData)
      
      // Emit event to show the suggestion window with visual feedback
      this.emit('showDotPhraseWindow', eventData)
      
      // Log that the event was emitted
      console.log('✅ [KEYBOARD] showDotPhraseWindow event emitted successfully')
    } catch (error) {
      console.error('❌ [KEYBOARD] Error getting cursor position:', error)
      
      // Fallback to mouse position
      const point = screen.getCursorScreenPoint()
      const fallbackData = {
        position: { x: point.x, y: point.y },
        trigger: 'manual',
        timestamp: Date.now()
      }
      
      console.log('📡 [KEYBOARD] Emitting fallback showDotPhraseWindow event:', fallbackData)
      this.emit('showDotPhraseWindow', fallbackData)
    }
  }

  private handleKeyPress(key: string) {
    // Queue the event processing to prevent blocking
    this.queueEvent(() => {
      const now = Date.now()
      
      // Reset buffer if too much time has passed (typing session ended)
      if (now - this.lastKeystroke > 2000) {
        this.textBuffer.length = 0 // More efficient than creating new array
      }
      
      this.textBuffer.push(key)
      
      // Keep buffer size manageable with efficient trimming
      if (this.textBuffer.length > this.maxBufferSize) {
        this.textBuffer.splice(0, this.textBuffer.length - this.maxBufferSize)
      }
      
      this.lastKeystroke = now
      this.currentText = this.textBuffer.join('')
      
      // Throttle expensive operations
      if (!this.isThrottled) {
        this.isThrottled = true
        
        // Check for slash phrases
        this.checkForSlashPhrase()
        
        // Emit text change event (throttled)
        this.emit('textChange', {
          text: this.currentText,
          position: this.getCursorPosition()
        })
        
        setTimeout(() => {
          this.isThrottled = false
        }, this.throttleDelay)
      }
    })
  }

  private handleBackspace() {
    if (this.textBuffer.length > 0) {
      this.textBuffer.pop()
      this.currentText = this.textBuffer.join('')
      
      this.emit('textChange', {
        text: this.currentText,
        position: this.getCursorPosition()
      })
    }
  }

  private checkForSlashPhrase() {
    // Look for slash phrases in the current text
    const slashMatch = this.currentText.match(/\/[a-zA-Z0-9_]*$/)
    
    if (slashMatch) {
      const phrase = slashMatch[0]
      
      if (phrase.length > 1) { // More than just "/"
        this.emit('slashPhrase', {
          phrase,
          position: this.getCursorPosition(),
          fullText: this.currentText
        })
      }
    }
  }

  async getCursorPosition(): Promise<{ x: number; y: number }> {
    // For now, use a smart position near the mouse cursor
    // In the future, we can implement more sophisticated text cursor detection
    const point = screen.getCursorScreenPoint()
    
    // Position slightly offset from mouse cursor to avoid overlapping
    return { 
      x: point.x + 20, 
      y: point.y + 20 
    }
  }

  // TODO: Implement proper text cursor detection using accessibility APIs
  // For now, using smart mouse cursor positioning as a fallback

  destroy() {
    if (this.isListening) {
      globalShortcut.unregisterAll()
      this.isListening = false
    }
    
    // Cleanup optimization resources
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    // Clear event queue
    this.eventQueue.length = 0
    this.textBuffer.length = 0
    
    // Remove all listeners
    this.removeAllListeners()
  }

  setEnabled(enabled: boolean) {
    if (enabled && !this.isListening) {
      this.startListening()
    } else if (!enabled && this.isListening) {
      this.destroy()
    }
  }
}