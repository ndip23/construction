import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 1. Import the Query Client tools
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PWAProvider } from './components/PWAProvider'

// 2. Create a client instance
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 3. Wrap your App in the Provider */}
    <QueryClientProvider client={queryClient}>
      <PWAProvider>
        <App />
      </PWAProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)