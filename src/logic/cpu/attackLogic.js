// src/logic/cpu/attackLogic.js
import { adjacencyMap, entryPointsByContinent } from "../../data/territoryGraph"
import { isAdjacentToEnemy } from "./utils"
import { resolveBattle } from "../battleLogic"

export function handleTurnPhaseLoop({
  territories,
  setTerritories,
  currentPlayer,
  nextTurn,
  reinforcements,
  setReinforcements,
  resolveBattle: unused,
  memory,
  logAction,
}) {
  if (memory.turnActive) return
  memory.turnActive = true

  // Clone territories for local mutation
  let workingTerritories = [...territories]

  if (reinforcements[currentPlayer.id] > 0) {
    let remaining = reinforcements[currentPlayer.id]

    const interval = setInterval(() => {
      if (remaining <= 0) {
        clearInterval(interval)
        setTimeout(() => startAttackLoop(workingTerritories), 0)
      } else {
        placeTurnTroop()
        remaining -= 1
      }
    }, 250)

    return
  }

  setTimeout(() => startAttackLoop(workingTerritories), 0)

  function placeTurnTroop() {
    const owned = workingTerritories.filter((t) => t.owner === currentPlayer.id)

    const priority1 = owned.filter((t) =>
      (adjacencyMap[t.id] || []).some((neighborId) => {
        const neighbor = workingTerritories.find((x) => x.id === neighborId)
        return neighbor && neighbor.owner && neighbor.owner !== currentPlayer.id
      })
    )

    const priority2 = owned.filter((t) =>
      (adjacencyMap[t.id] || []).some((neighborId) => {
        const neighbor = workingTerritories.find((x) => x.id === neighborId)
        return (
          neighbor &&
          neighbor.owner !== currentPlayer.id &&
          neighbor.owner?.startsWith("cpu")
        )
      })
    )

    const preferredContinent = memory.continent
    const inContinent = owned.filter((t) => t.continent === preferredContinent)
    const connectorIds = entryPointsByContinent[preferredContinent] || []
    const priority3 = inContinent.filter((t) => connectorIds.includes(t.id))

    let targets = priority1.length
      ? priority1
      : priority2.length
      ? priority2
      : priority3.length
      ? priority3
      : owned

    const index = memory.reinforceIndex % targets.length
    const target = targets[index]
    memory.reinforceIndex++

    // Modify workingTerritories directly instead of using setTerritories
    workingTerritories = workingTerritories.map((t) =>
      t.id === target.id ? { ...t, troops: t.troops + 1 } : t
    )

    logAction?.(`➕ ${currentPlayer.name} reinforced ${target.name}`)

    setReinforcements((prev) => ({
      ...prev,
      [currentPlayer.id]: prev[currentPlayer.id] - 1,
    }))
  }

  function startAttackLoop(current) {
    const runNextRound = (territoriesSnapshot) => {
      const attacks = getBestAttackSet(territoriesSnapshot)

      if (attacks.length === 0) {
        memory.turnActive = false
        setTerritories(territoriesSnapshot)
        nextTurn()
        return
      }

      executeAttackSet(attacks, territoriesSnapshot, runNextRound)
    }

    runNextRound(current)
  }

  function getBestAttackSet(currentTerritories) {
    const owned = currentTerritories.filter(
      (t) => t.owner === currentPlayer.id && t.troops > 2
    )

    const continentOwnership = {}
    for (const t of currentTerritories) {
      if (!continentOwnership[t.continent]) {
        continentOwnership[t.continent] = { owned: 0, total: 0 }
      }
      if (t.owner === currentPlayer.id) {
        continentOwnership[t.continent].owned++
      }
      continentOwnership[t.continent].total++
    }

    const priorityContinents = new Set(
      Object.entries(continentOwnership)
        .filter(([, data]) => data.owned >= 6)
        .map(([name]) => name)
    )

    const allAttacks = []

    for (const from of owned) {
      const neighbors = adjacencyMap[from.id] || []

      for (const neighborId of neighbors) {
        const to = currentTerritories.find((t) => t.id === neighborId)
        if (!to || !to.owner || to.owner === currentPlayer.id) continue

        let score = 0
        if (from.troops > to.troops) score += 10
        else if (from.troops === to.troops) score += 3
        else score -= 5

        if (priorityContinents.has(to.continent)) score += 5
        score += Math.max(0, 5 - to.troops)
        if (to.owner === "human") score += 15

        allAttacks.push({ from: from.id, to: to.id, score })
      }
    }

    allAttacks.sort((a, b) => b.score - a.score)

    const usedTargets = new Set()
    const attacksToPerform = []

    for (const attack of allAttacks) {
      if (!usedTargets.has(attack.to)) {
        attacksToPerform.push(attack)
        usedTargets.add(attack.to)
      }
      if (attacksToPerform.length >= 3) break
    }

    return attacksToPerform
  }

  function executeAttackSet(attacks, currentTerritories, callback) {
    let index = 0

    function next() {
      if (index >= attacks.length) {
        setTerritories(currentTerritories)
        callback(currentTerritories)
        return
      }

      const attack = attacks[index++]
      const result = resolveBattle({
        attackerId: attack.from,
        defenderId: attack.to,
        territories: currentTerritories,
        currentPlayer,
        logAction,
      })

      currentTerritories = result.updatedTerritories

      setTimeout(next, 400)
    }

    next()
  }
}
