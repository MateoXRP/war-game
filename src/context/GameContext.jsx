// src/context/GameContext.jsx
import { createContext, useContext, useState, useEffect } from "react"
import { initialTerritories, players as basePlayers } from "../data/gameData"
import { handleCpuTurn } from "../logic/cpuLogic"

const GameContext = createContext()

function rollDie() {
  return Math.floor(Math.random() * 6) + 1
}

export function GameProvider({ children }) {
  const [territories, setTerritories] = useState(initialTerritories)
  const [turnIndex, setTurnIndex] = useState(0)
  const [playerOrder, setPlayerOrder] = useState(null)
  const [isPlacementPhase, setIsPlacementPhase] = useState(true)
  const [isReinforcementPhase, setIsReinforcementPhase] = useState(false)
  const [reinforcements, setReinforcements] = useState({})

  const currentPlayer = playerOrder ? playerOrder[turnIndex % playerOrder.length] : null

  const nextTurn = () => {
    setTurnIndex((prev) => prev + 1)
  }

  // Determine player order via die rolls
  useEffect(() => {
    if (!playerOrder) {
      const rolls = basePlayers.map(p => ({ ...p, roll: rollDie() }))
      rolls.sort((a, b) => b.roll - a.roll)

      const ordered = [rolls[0], rolls[1], rolls[2]]
      setPlayerOrder(ordered)

      const initialReinforcements = {}
      ordered.forEach((p) => {
        initialReinforcements[p.id] = 35
      })
      setReinforcements(initialReinforcements)
    }
  }, [playerOrder])

  // Transition to reinforcement phase
  useEffect(() => {
    const claimed = territories.filter((t) => t.owner).length

    if (isPlacementPhase && claimed >= territories.length) {
      setIsPlacementPhase(false)
      setIsReinforcementPhase(true)

      const counts = {}
      playerOrder.forEach((p) => {
        const owned = territories.filter((t) => t.owner === p.id).length
        counts[p.id] = 35 - owned
      })
      setReinforcements(counts)
    }
  }, [territories, isPlacementPhase, playerOrder])

  // End reinforcement phase
  useEffect(() => {
    if (
      isReinforcementPhase &&
      Object.values(reinforcements).every((r) => r <= 0)
    ) {
      setIsReinforcementPhase(false)
    }
  }, [reinforcements, isReinforcementPhase])

  // Trigger CPU turn
  useEffect(() => {
    if (
      currentPlayer?.isCPU &&
      (isPlacementPhase || isReinforcementPhase)
    ) {
      handleCpuTurn({
        territories,
        setTerritories,
        currentPlayer,
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
        players: playerOrder || [],
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

