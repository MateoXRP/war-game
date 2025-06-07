// src/context/GameContext.jsx
import { createContext, useContext, useState, useEffect } from "react"
import { initialTerritories, players } from "../data/gameData"

const GameContext = createContext()

export function GameProvider({ children }) {
  const [territories, setTerritories] = useState(initialTerritories)
  const [turnIndex, setTurnIndex] = useState(0)
  const [isPlacementPhase, setIsPlacementPhase] = useState(true)

  const currentPlayer = players[turnIndex % players.length]

  const nextTurn = () => {
    setTurnIndex((prev) => prev + 1)
  }

  useEffect(() => {
    const claimed = territories.filter((t) => t.owner).length
    if (isPlacementPhase && claimed >= territories.length) {
      setIsPlacementPhase(false)
    }
  }, [territories, isPlacementPhase])

  return (
    <GameContext.Provider
      value={{
        territories,
        setTerritories,
        players,
        currentPlayer,
        nextTurn,
        isPlacementPhase,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => useContext(GameContext)

