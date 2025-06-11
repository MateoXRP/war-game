// src/screens/WorldPhase.jsx
import { useGame } from "../context/GameContext"
import WorldMap from "../components/map/WorldMap"
import { useLog } from "../context/LogContext"
import { useEffect, useRef, useState } from "react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "../firebase"

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
  const [leaderboard, setLeaderboard] = useState([])
  const [confirmSurrender, setConfirmSurrender] = useState(false)
  const [uiTroopsLeft, setUiTroopsLeft] = useState(35)

  useEffect(() => {
    if (isPlacementPhase && currentPlayer?.id === "human") {
      const ownedCount = territories.filter(t => t.owner === currentPlayer.id).length
      setUiTroopsLeft(35 - ownedCount)
    }
  }, [territories, isPlacementPhase, currentPlayer])

  useEffect(() => {
    if (isTurnPhase) {
      hasTurnStarted.current = true
    }
  }, [isTurnPhase])

  useEffect(() => {
    if (gameOver) {
      const fetchLeaderboard = async () => {
        try {
          const q = query(
            collection(db, "war_leaderboard"),
            orderBy("wins", "desc"),
            limit(10)
          )
          const snapshot = await getDocs(q)
          const data = snapshot.docs.map((doc) => doc.data())
          setLeaderboard(data)
        } catch (err) {
          console.error("Failed to load leaderboard:", err)
        }
      }
      fetchLeaderboard()
    }
  }, [gameOver])

  const handleSurrender = () => {
    setConfirmSurrender(false)
    const cleared = territories.map((t) =>
      t.owner === "human" ? { ...t, owner: null, troops: 0 } : t
    )
    setTerritories(cleared)
    setReinforcements((prev) => ({ ...prev, human: 0 }))
    nextTurn()
  }

  const downloadLog = () => {
    const element = document.createElement("a")
    const logText = actionLog.join("\n")
    const file = new Blob([logText], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "battle_log.txt"
    document.body.appendChild(element)
    element.click()
  }

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
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center space-y-6 p-4">
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
          <button
            onClick={downloadLog}
            className="bg-green-600 text-white font-semibold py-2 px-6 rounded-2xl shadow hover:bg-green-500"
          >
            📥 Download Log
          </button>
        </div>

        {leaderboard.length > 0 && (
          <div className="mt-8 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2 text-center">🏆 Leaderboard</h2>
            <table className="w-full text-sm text-left text-white border border-gray-600">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="px-2 py-1">#</th>
                  <th className="px-2 py-1">Name</th>
                  <th className="px-2 py-1">Wins</th>
                  <th className="px-2 py-1">Losses</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => (
                  <tr key={player.name} className="border-t border-gray-700">
                    <td className="px-2 py-1">{index + 1}</td>
                    <td className="px-2 py-1">{player.name}</td>
                    <td className="px-2 py-1">{player.wins}</td>
                    <td className="px-2 py-1">{player.losses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <div className="flex justify-between items-center px-6 py-4 bg-gray-800 shadow">
        <div className="text-lg font-semibold flex items-center space-x-3">
          <span>🌍 War Game</span>
          <span className="text-gray-300 text-sm">
            {isPlacementPhase
              ? "📦 Placement Phase"
              : isReinforcementPhase
              ? "➕ Reinforcement Phase"
              : "⚔️ Turn Phase"}
          </span>
        </div>
        <div className="text-sm text-gray-300">
          Current Turn: {currentPlayer?.name || "Loading..."}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-grow min-h-0">
          <WorldMap />
        </div>
        <div className="w-1/4 bg-gray-900 p-4 border-l border-gray-700 flex flex-col">
          <div className="text-sm text-gray-300 font-semibold mb-2">
            Troops Remaining:{" "}
            {isPlacementPhase
              ? uiTroopsLeft
              : (isReinforcementPhase || isTurnPhase) && currentPlayer?.id
              ? reinforcements[currentPlayer.id] ?? 0
              : "-"}
          </div>

          <div className="text-sm font-semibold text-white mb-1">📜 Battle Log</div>
          <div className="flex-1 overflow-y-auto text-xs space-y-1">
            {actionLog.slice(-50).map((entry, index) => (
              <div key={index} className="text-gray-400">
                {entry}
              </div>
            ))}
          </div>

          {!isPlacementPhase && (
            <div className="mt-4 space-y-2">
              <button
                onClick={nextTurn}
                className="bg-blue-600 w-full text-white font-semibold py-1 rounded-xl shadow hover:bg-blue-500"
              >
                ✅ End Turn
              </button>
              <button
                onClick={() => {
                  if (confirmSurrender) {
                    handleSurrender()
                  } else {
                    setConfirmSurrender(true)
                  }
                }}
                className="bg-red-600 w-full text-white font-semibold py-1 rounded-xl shadow hover:bg-red-500"
              >
                {confirmSurrender ? "❗ Are you sure?" : "🏳️ Surrender"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorldPhase
