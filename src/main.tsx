import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Ask the browser to keep our data even when the phone is low on space. Without this, iOS may evict it.
void navigator.storage?.persist?.().catch(() => {})

// iOS Safari only applies :active (the tap-press feedback) once the page has a touch listener.
document.addEventListener('touchstart', () => {}, { passive: true })

// iOS Safari ignores user-scalable=no, so stop the pinch gesture itself (no zoom, by the owner's choice).
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (event) => event.preventDefault())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
