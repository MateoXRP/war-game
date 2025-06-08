// src/context/GameContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react"
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
  const [lastCpuPlacementTurn, setLastCpuPlacementTurn] = useState(null)

  const playerOrderRef = useRef(null)

  const currentPlayer = playerOrder ? playerOrder[turnIndex % playerOrder.length] : null

  const nextTurn = () => {
    setTurnIndex((prev) => prev + 1)
  }

  // Determine turn order once and assign initial reinforcements
  useEffect(() => {
    if (!playerOrderRef.current) {
      const rolls = basePlayers.map(p => ({ ...p, roll: rollDie() }))
      rolls.sort((a, b) => b.roll - a.roll)
      playerOrderRef.current = rolls
      setPlayerOrder(rolls)

      const initialReinforcements = {}
      rolls.forEach((p) => {
        initialReinforcements[p.id] = 35
      })
      setReinforcements(initialReinforcements)
    }
  }, [])

  // Transition from placement to reinforcement phase
  useEffect(() => {
    const claimed = territories.filter((t) => t.owner).length

    if (isPlacementPhase && claimed >= territories.length) {
      setIsPlacementPhase(false)
      setIsReinforcementPhase(true)

      const counts = {}
      playerOrderRef.current.forEach((p) => {
        const owned = territories.filter((t) => t.owner === p.id).length
        const remaining = 35 - owned
        counts[p.id] = Math.max(remaining, 0)
      })
      setReinforcements(counts)
    }
  }, [territories, isPlacementPhase])

  // Transition from reinforcement to turn phase
  useEffect(() => {
    if (
      isReinforcementPhase &&
      Object.values(reinforcements).every((r) => r <= 0)
    ) {
      setIsReinforcementPhase(false)
      setIsTurnPhase(true)
    }
  }, [reinforcements, isReinforcementPhase])

  // Award troops at start of each player's turn in turn phase
  useEffect(() => {
    if (isTurnPhase && currentPlayer && turnIndex !== troopsAwardedTurn) {
      console.log(`=== Turn Phase started: ${currentPlayer.name} ===`)

      const owned = territories.filter(t => t.owner === currentPlayer.id)
      const ownedIds = new Set(owned.map(t => t.id))

      const bonusByContinent = {
        "North America": 4,
        "Europe": 6,
        "Asia": 4,
        "South America": 4,
        "Africa": 6,
        "Australia": 4,
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

  // CPU logic execution per phase
  useEffect(() => {
    console.log("CPU TURN CHECK", {
      currentPlayer,
      isPlacementPhase,
      isReinforcementPhase,
      isTurnPhase,
    })

    const isCpu = currentPlayer?.isCPU
    if (!isCpu) return

    const shouldRunPlacement =
      isPlacementPhase && turnIndex !== lastCpuPlacementTurn

    const shouldRunReinforcement =
      isReinforcementPhase && reinforcements[currentPlayer.id] > 0

    const shouldRunTurn =
      isTurnPhase && reinforcements[currentPlayer.id] > 0

    if (shouldRunPlacement || shouldRunReinforcement || shouldRunTurn) {
      if (shouldRunPlacement) {
        setLastCpuPlacementTurn(turnIndex)
      }

      setTimeout(() => {
        console.log("▶️ CPU logic running for:", currentPlayer.id)
        handleCpuTurn({
          territories,
          setTerritories,
          currentPlayer,
          nextTurn,
          isPlacementPhase,
          isReinforcementPhase,
          isTurnPhase,
          reinforcements,
          setReinforcements,
        })
      }, 300)
    }
  }, [
    currentPlayer,
    isPlacementPhase,
    isReinforcementPhase,
    isTurnPhase,
    reinforcements,
    turnIndex,
    lastCpuPlacementTurn,
  ])

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

