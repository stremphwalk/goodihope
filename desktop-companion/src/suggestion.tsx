import React from 'react'
import ReactDOM from 'react-dom/client'
import { SuggestionHandler } from './components/SuggestionHandler'
import './styles/index.css'

console.log('🚀 [SUGGESTION] suggestion.tsx script loaded')
console.log('🌐 [SUGGESTION] Current URL:', window.location.href)

const rootElement = document.getElementById('suggestion-root')
console.log('📦 [SUGGESTION] Root element:', rootElement)

if (rootElement) {
  console.log('✅ [SUGGESTION] Creating React root...')
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <SuggestionHandler />
    </React.StrictMode>
  )
  console.log('✅ [SUGGESTION] React app rendered')
} else {
  console.error('❌ [SUGGESTION] Could not find suggestion-root element!')
}