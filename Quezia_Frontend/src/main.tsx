import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { TestProvider } from './context/TestContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TestProvider>
          <App />
        </TestProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
