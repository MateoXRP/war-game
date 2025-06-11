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
  const [secondsElapsed, setSecondsElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameOver) setSecondsElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [gameOver])

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
            orderBy("bestTime", "asc"),
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

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const seconds = secs % 60
    return `${mins}:${seconds.toString().padStart(2, "0")}`
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
            ? `You conquered the world in ${formatTime(secondsElapsed)}!`
            : `You were eliminated by ${winner?.name}.`}
        </p>

        <div className="flex space-x-4">
          <button onClick={handleRestart} className="bg-yellow-500 text-black font-semibold py-2 px-6 rounded-2xl shadow hover:bg-yellow-400">🔁 Restart</button>
          <button onClick={handleSignOut} className="bg-red-600 text-white font-semibold py-2 px-6 rounded-2xl shadow hover:bg-red-500">🚪 Sign Out</button>
          <button onClick={downloadLog} className="bg-green-600 text-white font-semibold py-2 px-6 rounded-2xl shadow hover:bg-green-500">📥 Download Log</button>
        </div>

        {leaderboard.length > 0 && (
          <div className="mt-8 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2 text-center">🏆 Leaderboard</h2>
            <table className="w-full text-sm text-left text-white border border-gray-600">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="px-2 py-1">#</th>
                  <th className="px-2 py-1">Name</th>
                  <th className="px-2 py-1">Best Time</th>
                  <th className="px-2 py-1">W/L</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => (
                  <tr key={player.name} className="border-t border-gray-700">
                    <td className="px-2 py-1">{index + 1}</td>
                    <td className="px-2 py-1">{player.name}</td>
                    <td className="px-2 py-1">{formatTime(player.bestTime || 0)}</td>
                    <td className="px-2 py-1">{player.wins}/{player.losses}</td>
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
        <div className="text-lg font-semibold">
          🌍 War Game {isPlacementPhase ? "📦 Placement Phase" : isReinforcementPhase ? "➕ Reinforcement Phase" : "⚔️ Turn Phase"}
        </div>
        <div className="text-sm text-gray-300">
          Current Turn: {currentPlayer?.name || "Loading..."} ⏱ {formatTime(secondsElapsed)}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-grow min-h-0">
          <WorldMap />
        </div>

        <div className="w-1/4 bg-gray-900 p-4 border-l border-gray-700 flex flex-col">
          <div className="text-sm text-gray-300 font-semibold mb-2">
            Troops Remaining: {isPlacementPhase
              ? uiTroopsLeft
              : (isReinforcementPhase || isTurnPhase) && currentPlayer?.id
              ? reinforcements[currentPlayer.id] ?? 0
              : "-"}
          </div>

          {isTurnPhase && currentPlayer?.id === "human" && hasTurnStarted.current && (
            <div className="mb-4 flex flex-col items-center space-y-2 sticky top-0 bg-gray-900 z-10 pt-2 px-2">
              <button
                onClick={nextTurn}
                className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-green-500"
              >✅ End Turn</button>
              {!confirmSurrender ? (
                <button
                  onClick={() => setConfirmSurrender(true)}
                  className="w-full bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-red-500"
                >🏳️ Surrender</button>
              ) : (
                <div className="flex space-x-2 mt-2">
                  <span>Are you sure?</span>
                  <button onClick={handleSurrender} className="bg-red-700 text-white font-semibold px-3 rounded">✅ Yes</button>
                  <button onClick={() => setConfirmSurrender(false)} className="bg-gray-700 text-white font-semibold px-3 rounded">❌ No</button>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto pt-4 space-y-1 max-h-[calc(100vh-10rem)]">
            <h2 className="text-lg font-semibold mb-2">📜 Battle Log</h2>
            {[...actionLog].reverse().map((entry, index) => (
              <div key={index} className="text-sm text-gray-300">
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorldPhase
