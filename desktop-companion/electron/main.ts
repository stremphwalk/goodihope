import { app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { GlobalKeyboardListener } from './keyboardListener.js'
import { TextExpansionEngine } from './textExpansion.js'
import { SuggestionWindow } from './suggestionWindow.js'
import { performanceManager } from './performanceManager.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env')
console.log('Loading environment from:', envPath)
const envResult = config({ path: envPath })
if (envResult.error) {
  console.error('Error loading .env file:', envResult.error)
} else {
  console.log('Environment variables loaded successfully')
}

// Debug: log loaded environment variables
console.log('Loaded environment variables:', {
  REACT_APP_USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID ? 'SET' : 'NOT SET',
  REACT_APP_USER_POOL_CLIENT_ID: process.env.REACT_APP_USER_POOL_CLIENT_ID ? 'SET' : 'NOT SET',
  REACT_APP_OAUTH_DOMAIN: process.env.REACT_APP_OAUTH_DOMAIN ? 'SET' : 'NOT SET',
  REACT_APP_API_URL: process.env.REACT_APP_API_URL ? 'SET' : 'NOT SET'
})

class AriNoteCompanion {
  private mainWindow: BrowserWindow | null = null
  private suggestionWindow: SuggestionWindow | null = null
  private keyboardListener: GlobalKeyboardListener | null = null
  private textExpansion: TextExpansionEngine | null = null
  private tray: Tray | null = null

  constructor() {
    console.log('🏗️ [MAIN] AriNoteCompanion constructor called')
    this.init()
  }

  private async init() {
    await app.whenReady()
    
    console.log('🚀 [MAIN] App is ready, starting initialization...')
    
    // IMMEDIATE TEST: Create a window right away
    console.log('🧪 [MAIN] Creating immediate test window...')
    this.createTestWindow({ x: 50, y: 50 })
    
    this.createMainWindow()
    performanceManager.optimizeMemory()
    
    // Initialize core functionality first
    this.setupKeyboardListener() // Re-enabled with safe shortcuts only
    this.setupTextExpansion()
    
    // Defer heavy operations
    setTimeout(() => {
      this.createSuggestionWindow()
      this.setupTray()
      this.setupIPC()
      
      // Test window creation after a delay
      setTimeout(() => {
        console.log('🧪 [MAIN] Testing window creation on startup...')
        this.createTestWindow({ x: 100, y: 100 })
      }, 2000)
    }, 100)
    
    // Immediate test window creation
    setTimeout(() => {
      console.log('🧪 [MAIN] Creating immediate test window...')
      this.createTestWindow({ x: 50, y: 50 })
    }, 1000)
    
    // SIMPLE TEST: Create a basic window immediately
    console.log('🧪 [MAIN] Creating basic test window immediately...')
    this.createBasicTestWindow()
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow()
      }
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('will-quit', () => {
      this.cleanup()
    })
  }

  private createMainWindow() {
    console.log('🏠 [MAIN] Creating main window...')
    
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hiddenInset',
      show: false,
    })

    console.log('🏠 [MAIN] Main window created, loading content...')

    if (process.env.NODE_ENV === 'development') {
      // Try multiple ports to find the correct dev server
      const ports = [5174, 5173, 5175, 3000]
      let loaded = false
      
      for (const port of ports) {
        try {
          console.log(`🏠 [MAIN] Trying to load from port ${port}...`)
          this.mainWindow.loadURL(`http://localhost:${port}`)
          loaded = true
          console.log(`🏠 [MAIN] Successfully loaded from port ${port}`)
          break
        } catch (error) {
          console.log(`🏠 [MAIN] Failed to load from port ${port}:`, error)
        }
      }
      
      if (!loaded) {
        console.error('🏠 [MAIN] Could not load from any port, using fallback')
        this.mainWindow.loadURL('http://localhost:5174')
      }
      
      this.mainWindow.webContents.openDevTools()
    } else {
      console.log('🏠 [MAIN] Loading production file')
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }

    this.mainWindow.once('ready-to-show', () => {
      console.log('🏠 [MAIN] Main window ready to show')
      this.mainWindow?.show()
    })

    // Add webContents event listeners
    this.mainWindow.webContents.on('did-finish-load', () => {
      console.log('🏠 [MAIN] Main window finished loading')
    })

    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('🏠 [MAIN] Main window failed to load:', {
        errorCode,
        errorDescription,
        validatedURL
      })
    })
  }

  private createSuggestionWindow() {
    this.suggestionWindow = new SuggestionWindow()
  }

  private setupKeyboardListener() {
    this.keyboardListener = new GlobalKeyboardListener()
    
    this.keyboardListener.on('slashPhrase', (data) => {
      this.handleSlashPhrase(data)
    })

    this.keyboardListener.on('textChange', (data) => {
      this.handleTextChange(data)
    })

    this.keyboardListener.on('showDotPhraseWindow', (data) => {
      this.handleShowDotPhraseWindow(data)
    })

    // Handle shortcut registration failures
    this.keyboardListener.on('shortcutRegistrationFailed', (data) => {
      console.error('❌ [MAIN] Shortcut registration failed:', data)
      
      // Show a dialog to the user about permissions
      if (data.platform === 'darwin') {
        this.showPermissionDialog()
      }
    })
  }

  private setupTextExpansion() {
    this.textExpansion = new TextExpansionEngine()
  }

  private setupTray() {
    // Create tray icon (fallback to a simple icon if file doesn't exist)
    let trayIcon
    try {
      trayIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/tray-icon.png'))
      if (trayIcon.isEmpty()) {
        // Create a simple colored square as fallback
        trayIcon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
      }
    } catch (error) {
      // Fallback icon
      trayIcon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
    }
    
    this.tray = new Tray(trayIcon)
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show AriNote Companion',
        click: () => {
          this.showMainWindow()
        },
      },
      {
        label: 'Settings',
        click: () => {
          this.showMainWindow()
          this.mainWindow?.webContents.send('show-settings')
        },
      },
      { type: 'separator' },
      {
        label: 'Toggle Phrase Expansion',
        type: 'checkbox',
        checked: true,
        click: (item) => {
          this.textExpansion?.setEnabled(item.checked)
          this.mainWindow?.webContents.send('expansion-toggled', item.checked)
        },
      },
      {
        label: 'Phrase Statistics',
        click: () => {
          this.showPhraseStats()
        },
      },
      { type: 'separator' },
      {
        label: 'About AriNote Companion',
        click: () => {
          this.showAbout()
        },
      },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        },
      },
    ])
    
    this.tray.setContextMenu(contextMenu)
    this.tray.setToolTip('AriNote Companion - System-wide dot phrase expansion')
    
    // Double-click to show main window
    this.tray.on('double-click', () => {
      this.showMainWindow()
    })
  }

  private showMainWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      this.mainWindow.show()
      this.mainWindow.focus()
    }
  }

  private showPhraseStats() {
    // Send stats request to renderer
    this.showMainWindow()
    this.mainWindow?.webContents.send('show-phrase-stats')
  }

  private showPermissionDialog() {
    const { dialog } = require('electron')
    
    dialog.showMessageBox({
      type: 'warning',
      title: 'Accessibility Permission Required',
      message: 'AriNote Companion needs accessibility permissions to work properly.',
      detail: 'To enable the Command+/ shortcut:\n\n1. Go to System Preferences > Security & Privacy > Privacy > Accessibility\n2. Click the lock icon and enter your password\n3. Add "AriNote Companion" to the list\n4. Restart the app',
      buttons: ['Open System Preferences', 'OK'],
      defaultId: 0,
      cancelId: 1
    }).then((result: any) => {
      if (result.response === 0) {
        // Open System Preferences to Accessibility pane
        const { exec } = require('child_process')
        exec('open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"')
      }
    })
  }

  private showAbout() {
    const aboutWindow = new BrowserWindow({
      width: 400,
      height: 300,
      resizable: false,
      parent: this.mainWindow || undefined,
      modal: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    aboutWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>About AriNote Companion</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              padding: 40px; 
              text-align: center; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin: 0;
            }
            .logo { font-size: 48px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .version { font-size: 16px; opacity: 0.9; margin-bottom: 20px; }
            .description { font-size: 14px; opacity: 0.8; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="logo">🏥</div>
          <div class="title">AriNote Companion</div>
          <div class="version">Version 1.0.0</div>
          <div class="description">
            System-wide dot phrase expansion for medical documentation.<br>
            Bringing AriNote's powerful phrase system to your entire desktop.
          </div>
        </body>
      </html>
    `))

    aboutWindow.setMenu(null)
  }

  private setupIPC() {
    ipcMain.handle('get-cursor-position', async () => {
      return await this.keyboardListener?.getCursorPosition()
    })

    ipcMain.handle('expand-phrase', async (event, phraseData) => {
      return await this.textExpansion?.expandPhrase(phraseData)
    })

    ipcMain.handle('show-suggestion', async (event, suggestions, position) => {
      this.suggestionWindow?.show(suggestions, position)
    })

    ipcMain.handle('hide-suggestion', async () => {
      this.suggestionWindow?.hide()
    })

    // Smart options handling
    ipcMain.handle('complete-smart-options', async (event, expansionId, selections) => {
      if (this.textExpansion) {
        await this.textExpansion.completeSmartOptionsExpansion(expansionId, selections)
      }
    })

    ipcMain.handle('cancel-smart-options', async (event, expansionId) => {
      if (this.textExpansion) {
        this.textExpansion.cancelSmartOptionsExpansion(expansionId)
      }
    })

    // Suggestion window handlers
    ipcMain.handle('suggestion-selected', async (event, suggestion) => {
      console.log('Suggestion selected:', suggestion)
      if (this.textExpansion) {
        const success = await this.textExpansion.expandPhrase(suggestion)
        if (success) {
          // Hide the suggestion window
          this.suggestionWindow?.hide()
        }
        return success
      }
      return false
    })

    ipcMain.handle('close-suggestions', async (event) => {
      this.suggestionWindow?.hide()
    })
  }

  private handleSlashPhrase(data: { phrase: string; position: { x: number; y: number } }) {
    // Send to renderer for processing
    this.mainWindow?.webContents.send('slash-phrase-detected', data)
  }

  private handleTextChange(data: { text: string; position: { x: number; y: number } }) {
    // Send to renderer for processing
    this.mainWindow?.webContents.send('text-change', data)
  }

  private handleShowDotPhraseWindow(data: { position: { x: number; y: number }; trigger: string; timestamp: number }) {
    console.log('🎯 [MAIN] handleShowDotPhraseWindow called with data:', data)
    console.log('📊 [MAIN] Current state:', {
      suggestionWindowExists: !!this.suggestionWindow,
      mainWindowExists: !!this.mainWindow,
      isSuggestionWindowShowing: this.suggestionWindow?.isShowing()
    })
    
    // SIMPLE TEST: Create a basic window first
    console.log('🧪 [MAIN] Creating simple test window from shortcut...')
    this.createSimpleTestWindow(data.position)
    
    // Create a simple test window first to verify window creation works
    console.log('🧪 [MAIN] About to create test window...')
    this.createTestWindow(data.position)
    console.log('🧪 [MAIN] Test window creation completed')
    
    // Show the suggestion window immediately with loading state
    if (this.suggestionWindow) {
      console.log('🪟 [MAIN] Suggestion window exists, showing...')
      this.suggestionWindow.show([], data.position)
      console.log('✅ [MAIN] Suggestion window show() called')
    } else {
      console.error('❌ [MAIN] Suggestion window is null!')
    }
    
    // Send event to main window to load dot phrases (optional - for main app integration)
    if (this.mainWindow?.webContents) {
      console.log('📡 [MAIN] Sending show-dot-phrase-window event to main window')
      this.mainWindow.webContents.send('show-dot-phrase-window', data)
    }
    
    // Send event directly to suggestion window
    if (this.suggestionWindow?.isShowing()) {
      console.log('📡 [MAIN] Sending show-dot-phrase-window event to suggestion window')
      this.suggestionWindow.sendEvent('show-dot-phrase-window', data)
    }
    
    console.log('✅ [MAIN] handleShowDotPhraseWindow completed')
  }

  private createSimpleTestWindow(position: { x: number; y: number }) {
    console.log('🧪 [MAIN] Creating simple test window...')
    
    try {
      const simpleWindow = new BrowserWindow({
        width: 200,
        height: 150,
        frame: true,
        alwaysOnTop: true,
        transparent: false,
        resizable: false,
        skipTaskbar: false,
        show: true,
        focusable: true,
      })
      
      console.log('🧪 [MAIN] Simple test window created')
      
      // Load simple HTML
      simpleWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Simple Test</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                padding: 20px; 
                text-align: center; 
                background: #2196F3;
                color: white;
                margin: 0;
              }
              .title { font-size: 18px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="title">🔵 Simple Test</div>
            <div>Window creation works!</div>
          </body>
        </html>
      `))
      
      // Position and show
      simpleWindow.setPosition(position.x, position.y + 100)
      simpleWindow.show()
      simpleWindow.focus()
      
      console.log('🧪 [MAIN] Simple test window should be visible')
      
      // Close after 3 seconds
      setTimeout(() => {
        simpleWindow.close()
      }, 3000)
      
    } catch (error) {
      console.error('🧪 [MAIN] Error creating simple test window:', error)
    }
  }

  private createTestWindow(position: { x: number; y: number }) {
    console.log('🧪 [MAIN] Creating test window')
    
    try {
      const testWindow = new BrowserWindow({
        width: 300,
        height: 200,
        frame: true,
        alwaysOnTop: true,
        transparent: false,
        resizable: false,
        skipTaskbar: false,
        show: true,
        focusable: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      })
      
      console.log('🧪 [MAIN] Test window created successfully')
      
      // Load a simple HTML content
      testWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Window</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                padding: 40px; 
                text-align: center; 
                background: #ff6b6b;
                color: white;
                margin: 0;
              }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .message { font-size: 16px; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="title">🧪 Test Window</div>
            <div class="message">If you can see this, windows are working!</div>
            <div class="message">Press Cmd+/ again to test the real window</div>
          </body>
        </html>
      `))
      
      // Position the test window
      testWindow.setPosition(position.x, position.y + 50)
      
      // Force the window to be visible
      testWindow.show()
      testWindow.focus()
      testWindow.setAlwaysOnTop(true)
      
      // Log window state
      console.log('🧪 [MAIN] Test window state:', {
        isVisible: testWindow.isVisible(),
        isFocused: testWindow.isFocused(),
        isAlwaysOnTop: testWindow.isAlwaysOnTop()
      })
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        console.log('🧪 [MAIN] Closing test window')
        testWindow.close()
      }, 5000)
      
      console.log('🧪 [MAIN] Test window created and positioned')
    } catch (error) {
      console.error('🧪 [MAIN] Error creating test window:', error)
    }
  }

  private createBasicTestWindow() {
    console.log('🧪 [MAIN] Creating basic test window...')
    
    try {
      const basicWindow = new BrowserWindow({
        width: 300,
        height: 200,
        frame: true,
        alwaysOnTop: true,
        transparent: false,
        resizable: false,
        skipTaskbar: false,
        show: true,
        focusable: true,
      })
      
      console.log('🧪 [MAIN] Basic test window created')
      
      // Load simple HTML
      basicWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Basic Test</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                padding: 40px; 
                text-align: center; 
                background: #FF5722;
                color: white;
                margin: 0;
              }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .message { font-size: 16px; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="title">🟠 Basic Test</div>
            <div class="message">If you can see this orange window, the main process is working!</div>
            <div class="message">This window will close in 10 seconds.</div>
          </body>
        </html>
      `))
      
      // Position and show
      basicWindow.setPosition(200, 200)
      basicWindow.show()
      basicWindow.focus()
      
      console.log('🧪 [MAIN] Basic test window should be visible')
      
      // Close after 10 seconds
      setTimeout(() => {
        console.log('🧪 [MAIN] Closing basic test window')
        basicWindow.close()
      }, 10000)
      
    } catch (error) {
      console.error('🧪 [MAIN] Error creating basic test window:', error)
    }
  }

  private cleanup() {
    this.keyboardListener?.destroy()
    globalShortcut.unregisterAll()
  }
}

// Start the app
console.log('🚀 [MAIN] Starting AriNote Companion app...')
new AriNoteCompanion()
console.log('🚀 [MAIN] AriNoteCompanion instance created')