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
  logAction,
}) {
  if (memory.turnActive) return
  memory.turnActive = true

  if (reinforcements[currentPlayer.id] > 0) {
    let remaining = reinforcements[currentPlayer.id]

    const interval = setInterval(() => {
      if (remaining <= 0) {
        clearInterval(interval)
        startAttacks()
      } else {
        placeTurnTroop()
        remaining -= 1
      }
    }, 250)

    return
  }

  startAttacks()

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

    logAction?.(`➕ ${currentPlayer.name} reinforced ${target.name}`)

    setReinforcements((prev) => ({
      ...prev,
      [currentPlayer.id]: prev[currentPlayer.id] - 1,
    }))
  }

  function startAttacks() {
    const owned = territories.filter(
      (t) => t.owner === currentPlayer.id && t.troops > 1
    )

    const attackQueue = []

    for (const from of owned) {
      const neighbors = adjacencyMap[from.id] || []

      const enemies = neighbors
        .map((id) => territories.find((t) => t.id === id))
        .filter((t) =>
          t &&
          t.owner &&
          t.owner !== currentPlayer.id &&
          from.troops > t.troops // Avoid suicide attacks
        )
        .sort((a, b) => a.troops - b.troops) // Prioritize weak targets

      if (enemies.length > 0) {
        const weakest = enemies[0]
        attackQueue.push({ from: from.id, to: weakest.id })
      }
    }

    if (attackQueue.length === 0) {
      console.log(`⚠️ ${currentPlayer.name} has no valid attacks.`)
      memory.turnActive = false
      nextTurn()
      return
    }

    const maxAttacks = 3
    const attacksToPerform = attackQueue.slice(0, maxAttacks)

    function performNextAttack(index = 0) {
      if (index >= attacksToPerform.length) {
        memory.turnActive = false
        nextTurn()
        return
      }

      const { from, to } = attacksToPerform[index]
      const fromTerritory = territories.find((t) => t.id === from)
      const toTerritory = territories.find((t) => t.id === to)

      console.log(
        `🪖 ${currentPlayer.name} attacks from ${fromTerritory.name} (${fromTerritory.troops}) → ${toTerritory.name} (${toTerritory.troops} owned by ${toTerritory.owner})`
      )

      resolveBattle(from, to)

      setTimeout(() => performNextAttack(index + 1), 350)
    }

    performNextAttack()
  }
}

