import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

function scrollFocusedAboveKeyboard(kbHeight: number) {
  const el = document.activeElement as HTMLElement | null
  if (!el) return
  let scrollable = el.parentElement
  while (scrollable) {
    const ov = getComputedStyle(scrollable).overflowY
    if (ov === 'auto' || ov === 'scroll') break
    scrollable = scrollable.parentElement
  }
  if (!scrollable) return
  const elRect = el.getBoundingClientRect()
  const visibleBottom = window.innerHeight - kbHeight - 8
  if (elRect.bottom > visibleBottom) {
    scrollable.scrollTop += elRect.bottom - visibleBottom
  }
}

// Chrome 94+ PWA: virtual keyboard overlays content and fires geometrychange.
// visualViewport.height does NOT change in this mode, so we must use this API.
const vk = (navigator as any).virtualKeyboard
if (vk) {
  vk.overlaysContent = true
  let scrollTimer: ReturnType<typeof setTimeout> | null = null

  const handleVK = () => {
    const kbHeight: number = vk.boundingRect.height
    document.documentElement.style.setProperty('--keyboard-height', `${kbHeight}px`)

    if (kbHeight > 0) {
      if (scrollTimer) clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        scrollTimer = null
        requestAnimationFrame(() => scrollFocusedAboveKeyboard(kbHeight))
      }, 150)
    } else {
      if (scrollTimer) { clearTimeout(scrollTimer); scrollTimer = null }
    }
  }

  vk.addEventListener('geometrychange', handleVK)
  handleVK()

} else if (window.visualViewport) {
  // Fallback: use visualViewport (non-PWA Chrome, Firefox, Safari).
  let baseHeight = window.visualViewport.height
  let scrollTimer: ReturnType<typeof setTimeout> | null = null

  window.addEventListener('orientationchange', () => {
    setTimeout(() => { baseHeight = window.visualViewport!.height }, 300)
  })

  const update = () => {
    const vvHeight = window.visualViewport!.height
    if (vvHeight > baseHeight) baseHeight = vvHeight
    const kbHeight = Math.max(0, baseHeight - vvHeight)
    document.documentElement.style.setProperty('--keyboard-height', `${kbHeight}px`)

    if (kbHeight > 0) {
      if (scrollTimer) clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        scrollTimer = null
        requestAnimationFrame(() => scrollFocusedAboveKeyboard(kbHeight))
      }, 150)
    } else {
      if (scrollTimer) { clearTimeout(scrollTimer); scrollTimer = null }
    }
  }

  window.visualViewport.addEventListener('resize', update)
  update()
}

navigator.serviceWorker?.ready.then(reg => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reg.update()
  })
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
