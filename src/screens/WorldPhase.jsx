// src/screens/WorldPhase.jsx
import { useGame } from "../context/GameContext"
import WorldMap from "../components/map/WorldMap"

function WorldPhase() {
  const { currentPlayer, nextTurn } = useGame()

  return (
    <div className="bg-background text-white min-h-screen flex flex-col items-center justify-center py-6">
      <h2 className="text-2xl font-bold mb-1">World Map Phase</h2>
      <p className="text-sm text-gray-400 mb-4">
        Current Turn: <span className="text-white font-semibold">{currentPlayer.name}</span>
      </p>

      <div className="flex justify-center items-center w-full">
        <WorldMap />
      </div>

      <button
        onClick={nextTurn}
        className="mt-8 bg-primary hover:bg-green-600 text-black font-bold py-2 px-6 rounded-2xl shadow-md"
      >
        End Turn
      </button>
    </div>
  )
}

export default WorldPhase

