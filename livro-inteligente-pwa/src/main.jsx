import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { ConnectionStatusModalProvider } from './context/ConnectionStatusModalContext.jsx'
import { WidgetModalProvider } from './context/WidgetModalContext.jsx'
import { GlobalDialogProvider } from './context/GlobalDialogContext.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConnectionStatusModalProvider>
        <GlobalDialogProvider>
          <WidgetModalProvider>
            <App />
          </WidgetModalProvider>
        </GlobalDialogProvider>
      </ConnectionStatusModalProvider>
    </QueryClientProvider>
  </StrictMode>,
)
