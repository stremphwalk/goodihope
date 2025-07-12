# AriNote Companion Troubleshooting Guide

## Command+/ Shortcut Not Working

If the Command+/ shortcut isn't working in the AriNote Companion app, follow these steps:

### 1. Check macOS Accessibility Permissions

**Most Common Issue**: macOS requires explicit permission for apps to register global shortcuts.

1. Go to **System Preferences** > **Security & Privacy** > **Privacy** > **Accessibility**
2. Click the lock icon and enter your password
3. Add "AriNote Companion" to the list
4. Restart the AriNote Companion app

### 2. Test Shortcut Registration

Run the debug script to test if shortcuts can be registered:

```bash
cd desktop-companion
npm run debug:shortcuts
```

This will tell you if the issue is with:
- Accessibility permissions
- Conflicting shortcuts
- System restrictions

### 3. Check for Conflicting Shortcuts

Other apps might be using the same shortcut:
- Check if any other apps use Command+/
- Try temporarily disabling other keyboard shortcut apps
- Test with a different shortcut (the app tries multiple variations)

### 4. Development Mode Issues

If running in development mode:

1. **Ensure Vite dev server is running**:
   ```bash
   npm run dev:vite
   ```

2. **Check console logs** for suggestion window loading errors

3. **Verify the suggestion window loads**:
   - Look for "✅ [SUGGESTION] Suggestion page loaded successfully" in console
   - If not, check if the dev server is accessible at http://localhost:5173

### 5. Production Build Issues

If using the production build:

1. **Rebuild the app**:
   ```bash
   npm run build
   npm run dist:mac
   ```

2. **Check the built app** in the `release/` directory

### 6. Alternative Shortcuts

The app tries multiple shortcut variations:
- `CommandOrControl+/`
- `CmdOrCtrl+/`
- `Command+/`
- `Ctrl+/`

### 7. Debug Steps

1. **Check console output** for error messages
2. **Look for permission dialogs** when the app starts
3. **Verify the app is running** in the system tray
4. **Test with a simple text editor** to see if the shortcut triggers

### 8. Common Error Messages

- `"Failed to register any shortcuts!"` → Accessibility permissions needed
- `"Suggestion window is null!"` → Development server not running
- `"Page failed to load"` → Vite dev server not accessible

### 9. System Requirements

- macOS 11.0 or later
- Node.js 18+
- Electron 37+

### 10. Still Not Working?

1. **Restart the app** completely
2. **Restart your computer** to clear any system-level issues
3. **Check Activity Monitor** for any conflicting processes
4. **Try running as administrator** (if applicable)

## Getting Help

If the issue persists:
1. Check the console logs for specific error messages
2. Run the debug script and share the output
3. Verify your macOS version and permissions
4. Check if the issue occurs in both development and production builds 