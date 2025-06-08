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
  const [isTurnPhase, setIsTurnPhase] = useState(false)
  const [reinforcements, setReinforcements] = useState({})
  const [troopsAwardedTurn, setTroopsAwardedTurn] = useState(-1)

  const currentPlayer = playerOrder ? playerOrder[turnIndex % playerOrder.length] : null

  const nextTurn = () => {
    setTurnIndex((prev) => prev + 1)
  }

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

  useEffect(() => {
    const claimed = territories.filter((t) => t.owner).length

    if (isPlacementPhase && claimed >= territories.length) {
      setIsPlacementPhase(false)
      setIsReinforcementPhase(true)

      const counts = {}
      playerOrder.forEach((p) => {
        const owned = territories.filter((t) => t.owner === p.id).length
        const remaining = 35 - owned
        counts[p.id] = Math.max(remaining, 0)
      })
      setReinforcements(counts)
    }
  }, [territories, isPlacementPhase, playerOrder])

  useEffect(() => {
    if (
      isReinforcementPhase &&
      Object.values(reinforcements).every((r) => r <= 0)
    ) {
      setIsReinforcementPhase(false)
      setIsTurnPhase(true)
    }
  }, [reinforcements, isReinforcementPhase])

  useEffect(() => {
    if (isTurnPhase && currentPlayer && turnIndex !== troopsAwardedTurn) {
      console.log(`=== Turn Phase started: ${currentPlayer.name} ===`)

      const owned = territories.filter(t => t.owner === currentPlayer.id)
      const ownedIds = new Set(owned.map(t => t.id))

      const bonusByContinent = {
        "North America": 5,
        "Europe": 5,
        "Asia": 7,
        "South America": 2,
        "Africa": 3,
        "Australia": 2,
      }

      let continentBonus = 0
      for (const [continent, bonus] of Object.entries(bonusByContinent)) {
        const allInContinent = territories.filter(t => t.continent === continent).map(t => t.id)
        const fullyOwned = allInContinent.every(id => ownedIds.has(id))
        if (fullyOwned) {
          continentBonus += bonus
        }
      }

      const baseTroops = Math.max(3, Math.floor(owned.length / 3))
      const total = baseTroops + continentBonus

      console.log(`🪖 ${currentPlayer.name} awarded ${total} troops (${baseTroops} base + ${continentBonus} bonus)`)

      setReinforcements(prev => ({
        ...prev,
        [currentPlayer.id]: total,
      }))
      setTroopsAwardedTurn(turnIndex)
    }
  }, [isTurnPhase, currentPlayer, territories, turnIndex, troopsAwardedTurn])

  // ✅ CPU logic trigger with delay across all phases
  useEffect(() => {
    console.log("CPU TURN CHECK", {
      currentPlayer,
      isPlacementPhase,
      isReinforcementPhase,
      isTurnPhase,
    })

    if (currentPlayer?.isCPU) {
      const delay = 300
      setTimeout(() => {
        console.log("▶️ CPU logic running for:", currentPlayer.id)
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
      }, delay)
    }
  }, [currentPlayer, isPlacementPhase, isReinforcementPhase, isTurnPhase, reinforcements])

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
        isTurnPhase,
        reinforcements,
        setReinforcements,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => useContext(GameContext)

