// @ts-nocheck
/**
 * Microphone Debug Utilities
 * Helper functions to diagnose microphone permission issues
 */

export async function debugMicrophoneAccess() {
  console.log('🔍 Debugging Microphone Access...');
  
  try {
    // Check browser support
    console.log('1. Checking browser support...');
    if (!navigator.mediaDevices) {
      console.error('❌ navigator.mediaDevices not supported');
      return { success: false, error: 'Browser not supported' };
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia not supported');
      return { success: false, error: 'getUserMedia not supported' };
    }
    
    console.log('✅ Browser supports media devices');
    
    // Check permissions API if available
    console.log('2. Checking permissions API...');
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log(`📋 Permission state: ${permission.state}`);
      
      // Listen for permission changes
      permission.addEventListener('change', () => {
        console.log(`🔄 Permission changed to: ${permission.state}`);
      });
    } catch (permErr) {
      console.log('⚠️ Permissions API not available, this is normal in some browsers');
    }
    
    // Test direct access
    console.log('3. Testing direct microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    // Get audio track info
    const audioTracks = stream.getAudioTracks();
    console.log(`✅ Microphone access successful!`);
    console.log(`📱 Audio tracks: ${audioTracks.length}`);
    
    if (audioTracks.length > 0) {
      const track = audioTracks[0];
      console.log(`🎤 Microphone label: ${track.label || 'Unknown'}`);
      console.log(`⚙️ Settings:`, track.getSettings());
    }
    
    // Clean up
    stream.getTracks().forEach(track => {
      track.stop();
      console.log('🛑 Track stopped');
    });
    
    return { success: true, tracks: audioTracks.length };
    
  } catch (error: any) {
    console.error('❌ Microphone access failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Provide specific guidance
    switch (error.name) {
      case 'NotAllowedError':
        console.log('💡 Solution: Enable microphone access in browser settings');
        break;
      case 'NotFoundError':
        console.log('💡 Solution: Connect a microphone device');
        break;
      case 'NotSupportedError':
        console.log('💡 Solution: Use a supported browser (Chrome, Firefox, Safari)');
        break;
      default:
        console.log('💡 Try refreshing the page and granting permission when prompted');
    }
    
    return { success: false, error: error.message, errorType: error.name };
  }
}

export function logBrowserInfo() {
  console.log('🌐 Browser Information:');
  console.log(`User Agent: ${navigator.userAgent}`);
  console.log(`Platform: ${navigator.platform}`);
  console.log(`Language: ${navigator.language}`);
  console.log(`Online: ${navigator.onLine}`);
  console.log(`HTTPS: ${location.protocol === 'https:'}`);
  
  // Check if running on localhost
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  console.log(`Localhost: ${isLocalhost}`);
  
  if (!isLocalhost && location.protocol !== 'https:') {
    console.error('❌ CRITICAL: Microphone access requires HTTPS in production');
    console.log('💡 This may be why microphone access is failing');
    return false;
  }
  
  return true;
}

// Auto-run debug when imported in development
if (process.env.NODE_ENV === 'development') {
  // Only run debug once to avoid spam
  if (!(window as any).__micDebugRun) {
    (window as any).__micDebugRun = true;
    setTimeout(() => {
      logBrowserInfo();
      debugMicrophoneAccess().then(result => {
        console.log('🔍 Debug result:', result);
      });
    }, 1000);
  }
}