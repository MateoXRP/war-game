// src/logic/cpu/attackLogic.js
import { adjacencyMap, entryPointsByContinent } from "../../data/territoryGraph"
import { isAdjacentToEnemy } from "./utils"

export function handleTurnPhaseLoop({
  territories,
  setTerritories,
  currentPlayer,
  nextTurn,
  reinforcements,
  setReinforcements,
  resolveBattle,
  memory,
}) {
  if (memory.turnActive) return
  memory.turnActive = true

  if (reinforcements[currentPlayer.id] > 0) {
    let remaining = reinforcements[currentPlayer.id]

    const interval = setInterval(() => {
      if (remaining <= 0) {
        clearInterval(interval)
        performAttack()
      } else {
        placeTurnTroop()
        remaining -= 1
      }
    }, 250)

    return
  }

  performAttack()

  function placeTurnTroop() {
    const owned = territories.filter((t) => t.owner === currentPlayer.id)
    const frontline = owned.filter((t) =>
      isAdjacentToEnemy(t.id, territories, currentPlayer.id)
    )

    let targets = frontline

    if (targets.length === 0) {
      const preferredContinent = memory.continent
      const inContinent = owned.filter((t) => t.continent === preferredContinent)
      const connectorIds = entryPointsByContinent[preferredContinent] || []
      targets = inContinent.filter((t) => connectorIds.includes(t.id))
    }

    if (targets.length === 0) {
      targets = owned
    }

    const index = memory.reinforceIndex % targets.length
    const target = targets[index]
    memory.reinforceIndex++

    setTerritories((prev) =>
      prev.map((t) =>
        t.id === target.id ? { ...t, troops: t.troops + 1 } : t
      )
    )

    setReinforcements((prev) => ({
      ...prev,
      [currentPlayer.id]: prev[currentPlayer.id] - 1,
    }))
  }

  function performAttack() {
    const owned = territories.filter(
      (t) => t.owner === currentPlayer.id && t.troops > 1
    )

    const attackPairs = []
    for (const from of owned) {
      const neighbors = adjacencyMap[from.id] || []
      const enemies = neighbors
        .map((id) => territories.find((t) => t.id === id))
        .filter((t) => t && t.owner !== currentPlayer.id)

      if (enemies.length > 0) {
        const weakest = enemies.reduce((a, b) => (a.troops < b.troops ? a : b))
        attackPairs.push({ from: from.id, to: weakest.id })
      }
    }

    if (attackPairs.length === 0) {
      console.log(`⚠️ ${currentPlayer.name} has no valid attacks.`)
      memory.turnActive = false // ✅ fix: always reset
      nextTurn()
      return
    }

    const { from, to } = attackPairs[0]
    const fromTerritory = territories.find((t) => t.id === from)
    const toTerritory = territories.find((t) => t.id === to)

    console.log(
      `🪖 ${currentPlayer.name} attacks from ${fromTerritory.name} (${fromTerritory.troops}) → ${toTerritory.name} (${toTerritory.troops} owned by ${toTerritory.owner})`
    )

    resolveBattle(from, to)

    setTimeout(() => {
      memory.turnActive = false // ✅ fix: always reset here too
      nextTurn()
    }, 350)
  }
}

