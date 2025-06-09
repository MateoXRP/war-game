// src/screens/WorldPhase.jsx
import { useGame } from "../context/GameContext"
import WorldMap from "../components/map/WorldMap"

function WorldPhase() {
  const {
    currentPlayer,
    isPlacementPhase,
    isReinforcementPhase,
    territories,
    reinforcements,
    actionLog,
  } = useGame()

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
    </div>
  )
}

export default WorldPhase

