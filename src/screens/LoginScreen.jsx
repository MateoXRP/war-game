// src/screens/LoginScreen.jsx
import { useState } from "react"

export default function LoginScreen() {
  const [name, setName] = useState("")

  const handleLogin = () => {
    if (name.trim()) {
      localStorage.setItem("playerName", name.trim())
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center space-y-6">
      <h1 className="text-4xl font-bold">🌍 War Game</h1>
      <div className="flex flex-col items-center space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="px-4 py-2 rounded-lg text-black w-64 text-center"
        />
        <button
          onClick={handleLogin}
          className="bg-yellow-500 text-black font-semibold py-2 px-6 rounded-2xl shadow hover:bg-yellow-400"
        >
          🎮 Start Game
        </button>
      </div>
    </div>
  )
}

