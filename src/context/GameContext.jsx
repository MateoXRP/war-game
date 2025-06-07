// src/context/GameContext.jsx
import { createContext, useContext, useState, useEffect } from "react"
import { initialTerritories, players } from "../data/gameData"
import { handleCpuTurn } from "../logic/cpuLogic"

const GameContext = createContext()

export function GameProvider({ children }) {
  const [territories, setTerritories] = useState(initialTerritories)
  const [turnIndex, setTurnIndex] = useState(0)
  const [isPlacementPhase, setIsPlacementPhase] = useState(true)
  const [isReinforcementPhase, setIsReinforcementPhase] = useState(false)
  const [reinforcements, setReinforcements] = useState(() =>
    players.reduce((acc, p) => ({ ...acc, [p.id]: 35 }), {})
  )

  const currentPlayer = players[turnIndex % players.length]

  const nextTurn = () => {
    setTurnIndex((prev) => prev + 1)
  }

  // Handle transition from placement to reinforcement phase
  useEffect(() => {
    const claimed = territories.filter((t) => t.owner).length

    if (isPlacementPhase && claimed >= territories.length) {
      setIsPlacementPhase(false)
      setIsReinforcementPhase(true)

      // Subtract claimed territories from reinforcements
      const counts = {}
      players.forEach((p) => {
        const owned = territories.filter((t) => t.owner === p.id).length
        counts[p.id] = 35 - owned
      })
      setReinforcements(counts)
    }
  }, [territories, isPlacementPhase])

  // Handle end of reinforcement phase
  useEffect(() => {
    if (
      isReinforcementPhase &&
      Object.values(reinforcements).every((r) => r <= 0)
    ) {
      setIsReinforcementPhase(false)
    }
  }, [reinforcements, isReinforcementPhase])

  // Trigger CPU move automatically
  useEffect(() => {
    const player = currentPlayer
    if (player.isCPU && (isPlacementPhase || isReinforcementPhase)) {
      handleCpuTurn({
        territories,
        setTerritories,
        currentPlayer: player,
        nextTurn,
        isPlacementPhase,
        isReinforcementPhase,
        reinforcements,
        setReinforcements,
      })
    }
  }, [currentPlayer, isPlacementPhase, isReinforcementPhase])

  return (
    <GameContext.Provider
      value={{
        territories,
        setTerritories,
        players,
        currentPlayer,
        nextTurn,
        isPlacementPhase,
        isReinforcementPhase,
        reinforcements,
        setReinforcements,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => useContext(GameContext)

