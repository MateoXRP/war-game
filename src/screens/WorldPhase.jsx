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
  } = useGame()

  // Calculate troops remaining
  let troopsRemaining = null

  if (isPlacementPhase) {
    const claimed = territories.filter((t) => t.owner === currentPlayer.id).length
    troopsRemaining = 35 - claimed
  } else if (isReinforcementPhase) {
    troopsRemaining = reinforcements[currentPlayer.id]
  }

  return (
    <div className="bg-background text-white min-h-screen flex flex-col items-center justify-center py-6">
      <h2 className="text-2xl font-bold mb-1">World Map Phase</h2>

      <p className="text-sm text-gray-400 mb-2">
        Current Turn: <span className="text-white font-semibold">{currentPlayer.name}</span>
      </p>

      {troopsRemaining !== null && (
        <p className="text-sm text-gray-300 mb-4">
          Troops Remaining: <span className="text-white font-semibold">{troopsRemaining}</span>
        </p>
      )}

      <div className="flex justify-center items-center w-full">
        <WorldMap />
      </div>
    </div>
  )
}

export default WorldPhase

