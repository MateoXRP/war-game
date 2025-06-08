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

  const [selectedSource, setSelectedSource] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)

  const playerOrderRef = useRef(null)

  const currentPlayer = playerOrder ? playerOrder[turnIndex % playerOrder.length] : null

  const nextTurn = () => {
    setTurnIndex((prev) => prev + 1)
    setSelectedSource(null)
    setSelectedTarget(null)
  }

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

      setReinforcements(prev => ({
        ...prev,
        [currentPlayer.id]: total,
      }))
      setTroopsAwardedTurn(turnIndex)
    }
  }, [isTurnPhase, currentPlayer, territories, turnIndex, troopsAwardedTurn])

  useEffect(() => {
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
          resolveBattle, // ✅ FIX: Pass this so CPU can attack
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

  function resolveBattle(attackerId, defenderId) {
    const attacker = territories.find((t) => t.id === attackerId)
    const defender = territories.find((t) => t.id === defenderId)

    if (!attacker || !defender) return
    if (attacker.troops < 2) return

    const attackerDice = Math.min(3, attacker.troops - 1)
    const defenderDice = Math.min(2, defender.troops)

    const attackRolls = Array.from({ length: attackerDice }, rollDie).sort((a, b) => b - a)
    const defenseRolls = Array.from({ length: defenderDice }, rollDie).sort((a, b) => b - a)

    let attackerLosses = 0
    let defenderLosses = 0

    for (let i = 0; i < Math.min(attackRolls.length, defenseRolls.length); i++) {
      if (attackRolls[i] > defenseRolls[i]) {
        defenderLosses++
      } else {
        attackerLosses++
      }
    }

    setTerritories((prev) =>
      prev.map((t) => {
        if (t.id === attacker.id) {
          return { ...t, troops: t.troops - attackerLosses }
        }
        if (t.id === defender.id) {
          const remainingTroops = t.troops - defenderLosses
          if (remainingTroops <= 0) {
            return {
              ...t,
              owner: attacker.owner,
              troops: attackerDice - attackerLosses,
            }
          }
          return { ...t, troops: remainingTroops }
        }
        return t
      })
    )

    setSelectedSource(null)
    setSelectedTarget(null)
  }

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
        selectedSource,
        setSelectedSource,
        selectedTarget,
        setSelectedTarget,
        resolveBattle,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => useContext(GameContext)

