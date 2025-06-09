// src/context/LogContext.jsx
import { createContext, useContext, useState } from "react"

const LogContext = createContext()

export function LogProvider({ children }) {
  const [actionLog, setActionLog] = useState([])

  function logAction(message) {
    setActionLog((prev) => [...prev.slice(-49), message])
  }

  return (
    <LogContext.Provider value={{ actionLog, logAction }}>
      {children}
    </LogContext.Provider>
  )
}

export const useLog = () => useContext(LogContext)

