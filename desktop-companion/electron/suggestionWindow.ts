import { BrowserWindow, screen } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class SuggestionWindow {
  private window: BrowserWindow | null = null
  private isVisible = false

  constructor() {
    this.createWindow()
    this.setupWindowEvents()
  }

  private createWindow() {
    this.window = new BrowserWindow({
      width: 400,
      height: 300,
      frame: false,
      alwaysOnTop: true,
      transparent: false, // Changed to false for better visibility
      resizable: false,
      skipTaskbar: true,
      show: false,
      focusable: true, // Ensure window can receive focus
      modal: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'suggestionPreload.js'),
      },
    })

    // Load the suggestion UI
    if (process.env.NODE_ENV === 'development') {
      // Try multiple ports to find the correct dev server
      this.loadDevURL()
    } else {
      this.window.loadFile(path.join(__dirname, '../dist/suggestion.html'))
    }

    // Add error handling for window creation
    this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('❌ [SUGGESTION] Window failed to load:', {
        errorCode,
        errorDescription,
        validatedURL
      })
    })

    this.window.webContents.on('did-finish-load', () => {
      console.log('✅ [SUGGESTION] Window loaded successfully')
    })
  }

  private async loadDevURL() {
    const ports = [5173, 5174, 5175, 3000] // Common Vite dev server ports
    
    for (const port of ports) {
      try {
        const url = `http://localhost:${port}/`
        console.log(`🔍 [SUGGESTION] Trying to load from: ${url}`)
        
        // Test if the port is accessible with a timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout
        
        try {
          const response = await fetch(url, { 
            signal: controller.signal,
            method: 'HEAD' // Just check if server is up
          })
          
          clearTimeout(timeoutId)
          
          if (response.ok) {
            console.log(`✅ [SUGGESTION] Found dev server on port ${port}`)
            const suggestionUrl = `${url}?window=suggestion`
            console.log(`📦 [SUGGESTION] Loading suggestion window with URL: ${suggestionUrl}`)
            
            if (this.window) {
              this.window.loadURL(suggestionUrl)
              
              // Add event listener to check if the page loaded successfully
              this.window.webContents.once('did-finish-load', () => {
                console.log('✅ [SUGGESTION] Suggestion page loaded successfully')
              })
              
              this.window.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
                console.error('❌ [SUGGESTION] Suggestion page failed to load:', errorCode, errorDescription)
              })
            }
            return
          }
        } catch (fetchError) {
          clearTimeout(timeoutId)
          console.log(`⚠️ [SUGGESTION] Port ${port} not accessible:`, fetchError.message)
        }
      } catch (error) {
        console.log(`❌ [SUGGESTION] Error checking port ${port}:`, error)
      }
    }
    
    // Fallback: try to load from the main dev server anyway
    console.warn('⚠️ [SUGGESTION] Could not find dev server, trying fallback...')
    const fallbackUrl = 'http://localhost:5173/?window=suggestion'
    console.log(`🔄 [SUGGESTION] Loading fallback URL: ${fallbackUrl}`)
    
    if (this.window) {
      this.window.loadURL(fallbackUrl)
      
      // Add a longer timeout for the fallback
      setTimeout(() => {
        if (this.window && !this.window.webContents.isLoading()) {
          console.log('✅ [SUGGESTION] Fallback URL loaded successfully')
        } else {
          console.error('❌ [SUGGESTION] Fallback URL failed to load')
        }
      }, 5000)
    }
  }

  private setupWindowEvents() {
    if (!this.window) return
    
    // Hide window when it loses focus
    this.window.on('blur', () => {
      console.log('🔍 [SUGGESTION] Window lost focus, hiding...')
      this.hide()
    })

    // Log window state changes
    this.window.on('show', () => {
      console.log('👁️ [SUGGESTION] Window show event fired')
    })

    this.window.on('focus', () => {
      console.log('🎯 [SUGGESTION] Window focus event fired')
    })

    this.window.on('hide', () => {
      console.log('🙈 [SUGGESTION] Window hide event fired')
    })
  }

  show(suggestions: any[], position: { x: number; y: number }) {
    if (!this.window) {
      console.error('❌ [SUGGESTION] Window is null, cannot show')
      return
    }

    console.log('🪟 [SUGGESTION] Showing window with', suggestions.length, 'suggestions at', position)
    console.log('📊 [SUGGESTION] Window state before show:', {
      isVisible: this.isVisible,
      windowExists: !!this.window,
      windowIsVisible: this.window.isVisible(),
      windowIsFocused: this.window.isFocused()
    })

    // Calculate optimal position
    const displays = screen.getAllDisplays()
    const currentDisplay = screen.getDisplayNearestPoint(position)
    
    let x = position.x
    let y = position.y + 20 // Offset below cursor
    
    // Ensure window stays within screen bounds
    const windowBounds = { width: 400, height: 300 }
    
    if (x + windowBounds.width > currentDisplay.bounds.x + currentDisplay.bounds.width) {
      x = currentDisplay.bounds.x + currentDisplay.bounds.width - windowBounds.width
    }
    
    if (y + windowBounds.height > currentDisplay.bounds.y + currentDisplay.bounds.height) {
      y = position.y - windowBounds.height - 10 // Show above cursor instead
    }

    console.log('📍 [SUGGESTION] Final position:', { x, y })
    this.window.setPosition(x, y)
    
    // Send suggestions to the window
    console.log('📡 [SUGGESTION] Sending update-suggestions event')
    this.window.webContents.send('update-suggestions', suggestions)
    
    // AGGRESSIVE WINDOW SHOWING - Multiple techniques to ensure visibility
    console.log('👁️ [SUGGESTION] Making window visible and focused with aggressive approach')
    
    // Technique 1: Basic show and focus
    this.window.show()
    this.window.focus()
    this.window.setAlwaysOnTop(true)
    this.window.moveTop()
    
    // Technique 2: Force visibility on all workspaces
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    
    // Technique 3: Set window level to be above everything
    this.window.setAlwaysOnTop(true, 'screen-saver')
    
    // Technique 4: Force window to front
    this.window.moveTop()
    
    console.log('📊 [SUGGESTION] Window state after aggressive show:', {
      isVisible: this.window.isVisible(),
      isFocused: this.window.isFocused(),
      isAlwaysOnTop: this.window.isAlwaysOnTop()
    })
    
    // Multiple retry attempts with different techniques
    let retryCount = 0
    const maxRetries = 10
    
    const ensureVisibility = () => {
      if (!this.window) return
      
      if (!this.window.isVisible() || !this.window.isFocused()) {
        console.log(`🔄 [SUGGESTION] Retry ${retryCount + 1}/${maxRetries}: Ensuring window visibility`)
        
        // Try different techniques each retry
        this.window.show()
        this.window.focus()
        this.window.setAlwaysOnTop(true, 'screen-saver')
        this.window.moveTop()
        this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
        
        retryCount++
        
        if (retryCount < maxRetries) {
          setTimeout(ensureVisibility, 200)
        } else {
          console.log('⚠️ [SUGGESTION] Max retries reached, trying alternative approach')
          // Last resort: try to create a new window
          this.createFallbackWindow(suggestions, position)
        }
      } else {
        console.log('✅ [SUGGESTION] Window is visible and focused')
      }
    }
    
    // Initial check after a short delay
    setTimeout(ensureVisibility, 100)
    
    this.isVisible = true
    console.log('✅ [SUGGESTION] Show method completed')
  }

  private createFallbackWindow(suggestions: any[], position: { x: number; y: number }) {
    console.log('🆘 [SUGGESTION] Creating fallback window')
    
    const fallbackWindow = new BrowserWindow({
      width: 400,
      height: 300,
      frame: true, // Use frame for better visibility
      alwaysOnTop: true,
      transparent: false,
      resizable: false,
      skipTaskbar: false, // Show in taskbar
      show: true,
      focusable: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'suggestionPreload.js'),
      },
    })
    
    // Load the same content
    if (process.env.NODE_ENV === 'development') {
      fallbackWindow.loadURL('http://localhost:5174/?window=suggestion')
    } else {
      fallbackWindow.loadFile(path.join(__dirname, '../dist/suggestion.html'))
    }
    
    // Position the fallback window
    fallbackWindow.setPosition(position.x, position.y + 20)
    
    // Send suggestions
    fallbackWindow.webContents.on('did-finish-load', () => {
      fallbackWindow.webContents.send('update-suggestions', suggestions)
    })
    
    console.log('🆘 [SUGGESTION] Fallback window created')
  }

  sendEvent(eventName: string, data: any) {
    if (!this.window) {
      console.error('❌ [SUGGESTION] Cannot send event, window is null')
      return
    }
    
    console.log('📡 [SUGGESTION] Sending event:', eventName, data)
    this.window.webContents.send(eventName, data)
  }

  hide() {
    if (this.window && this.isVisible) {
      console.log('🙈 [SUGGESTION] Hiding window')
      this.window.hide()
      this.isVisible = false
    }
  }

  destroy() {
    if (this.window) {
      this.window.destroy()
      this.window = null
    }
  }

  isShowing(): boolean {
    return this.isVisible && this.window?.isVisible() === true
  }
}