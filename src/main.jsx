// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GameProvider } from './context/GameContext.jsx'
import { LogProvider } from './context/LogContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LogProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </LogProvider>
  </React.StrictMode>,
)

