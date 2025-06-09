// src/App.jsx
import { useEffect, useState } from "react"
import WorldPhase from "./screens/WorldPhase"
import LoginScreen from "./screens/LoginScreen"

function App() {
  const [playerName, setPlayerName] = useState(null)

  useEffect(() => {
    const name = localStorage.getItem("playerName")
    if (name) {
      setPlayerName(name)
    }
  }, [])

  return (
    <>
      {playerName ? <WorldPhase /> : <LoginScreen />}
    </>
  )
}

export default App

