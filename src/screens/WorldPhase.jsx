// src/screens/WorldPhase.jsx
import { useGame } from "../context/GameContext"
import WorldMap from "../components/map/WorldMap"
import { useLog } from "../context/LogContext"

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

  if (gameOver) {
    const isVictory = winner?.id === "human"

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
          {isVictory ? "🎉 You Win!" : "💀 Game Over"}
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

  let troopsRemaining = null

  if (isPlacementPhase) {
    const claimed = territories.filter((t) => t.owner === currentPlayer.id).length
    troopsRemaining = 35 - claimed
  } else if (isReinforcementPhase) {
    troopsRemaining = reinforcements[currentPlayer.id]
  }

  return (
    <div className="bg-background text-white min-h-screen flex flex-col items-center justify-center py-6 px-4 space-y-4">
      <h2 className="text-2xl font-bold mb-1">World Map</h2>

      <p className="text-sm text-gray-400 mb-2">
        Current Turn: <span className="text-white font-semibold">{currentPlayer.name}</span>
      </p>

      {troopsRemaining !== null && (
        <p className="text-sm text-gray-300">
          Troops Remaining: <span className="text-white font-semibold">{troopsRemaining}</span>
        </p>
      )}

      <div className="flex justify-center items-center w-full">
        <WorldMap />
      </div>

      {/* Log Panel */}
      <div className="bg-gray-900 w-full max-w-4xl mt-6 p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-2 text-yellow-400">📜 Battle Log</h3>
        <div className="h-40 overflow-y-auto text-sm space-y-1 pr-2">
          {actionLog.length === 0 && (
            <div className="text-gray-500 italic">No actions yet...</div>
          )}
          {[...actionLog].reverse().map((entry, index) => (
            <div key={index} className="text-white">
              {entry}
            </div>
          ))}
        </div>
      </div>

      {/* Surrender Button (after log) */}
      {isTurnPhase && currentPlayer?.id === "human" && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              const cleared = territories.map((t) =>
                t.owner === "human" ? { ...t, owner: null, troops: 0 } : t
              )
              setTerritories(cleared)
              setReinforcements((prev) => ({ ...prev, human: 0 }))
              nextTurn()
            }}
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-red-500"
          >
            🏳️ Surrender
          </button>
        </div>
      )}
    </div>
  )
}

export default WorldPhase

