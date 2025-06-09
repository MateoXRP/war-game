// src/screens/WorldPhase.jsx
import { useGame } from "../context/GameContext"
import WorldMap from "../components/map/WorldMap"
import { useLog } from "../context/LogContext"
import { useEffect, useRef } from "react"

function WorldPhase() {
  const {
    currentPlayer,
    isPlacementPhase,
    isReinforcementPhase,
    isTurnPhase,
    territories,
    setTerritories,
    reinforcements,
    setReinforcements,
    nextTurn,
    gameOver,
    winner,
  } = useGame()

  const { actionLog } = useLog()
  const hasTurnStarted = useRef(false)

  useEffect(() => {
    if (isTurnPhase) {
      hasTurnStarted.current = true
    }
  }, [isTurnPhase])

  if (gameOver) {
    const isVictory = winner?.id === "human"
    const playerName = localStorage.getItem("playerName")

    const handleRestart = () => {
      window.location.reload()
    }

    const handleSignOut = () => {
      localStorage.removeItem("playerName")
      window.location.reload()
    }

    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center space-y-6">
        <h1 className="text-4xl font-bold">
          {isVictory ? `🎉 ${playerName} Wins!` : "💀 Game Over"}
        </h1>
        <p className="text-lg text-gray-300">
          {isVictory
            ? "You conquered the world!"
            : `You were eliminated by ${winner?.name}.`}
        </p>
        <div className="flex space-x-4">
          <button
            onClick={handleRestart}
            className="bg-yellow-500 text-black font-semibold py-2 px-6 rounded-2xl shadow hover:bg-yellow-400"
          >
            🔁 Restart
          </button>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white font-semibold py-2 px-6 rounded-2xl shadow hover:bg-red-500"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    )
  }

  const handleSurrender = () => {
    const cleared = territories.map((t) =>
      t.owner === "human" ? { ...t, owner: null, troops: 0 } : t
    )
    setTerritories(cleared)
    setReinforcements((prev) => ({ ...prev, human: 0 }))
    nextTurn()
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <div className="flex justify-between items-center px-6 py-4 bg-gray-800 shadow">
        <div className="text-lg font-semibold">
          {isPlacementPhase
            ? "📦 Placement Phase"
            : isReinforcementPhase
            ? "➕ Reinforcement Phase"
            : "⚔️ Turn Phase"}
        </div>
        <div className="text-sm text-gray-300">
          Current Turn: {currentPlayer?.name || "Loading..."}
        </div>
        <div className="text-sm text-gray-300">
          Troops Remaining: {reinforcements[currentPlayer?.id] ?? 0}
        </div>
      </div>

      <div className="flex flex-1">
        <div className="w-3/4">
          <WorldMap />
        </div>
        <div className="w-1/4 bg-gray-900 p-4 border-l border-gray-700 flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto space-y-1">
            <h2 className="text-lg font-semibold mb-2">📜 Battle Log</h2>
            {[...actionLog].slice(-20).reverse().map((entry, index) => (
              <div key={index} className="text-sm text-gray-300">
                {entry}
              </div>
            ))}
          </div>

          {isTurnPhase && currentPlayer?.id === "human" && hasTurnStarted.current && (
            <div className="mt-4 text-center">
              <button
                onClick={handleSurrender}
                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-red-500"
              >
                🏳️ Surrender
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorldPhase

