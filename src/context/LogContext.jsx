// src/context/LogContext.jsx
import { createContext, useContext, useState } from "react"

const LogContext = createContext()

export function LogProvider({ children }) {
  const [actionLog, setActionLog] = useState([])

  const logAction = (entry) => {
    setActionLog((prev) => [...prev, entry])
  }

  return (
    <LogContext.Provider value={{ actionLog, logAction }}>
      {children}
    </LogContext.Provider>
  )
}

export const useLog = () => useContext(LogContext)
