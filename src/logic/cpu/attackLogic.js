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
        startAttackLoop()
      } else {
        placeTurnTroop()
        remaining -= 1
      }
    }, 250)

    return
  }

  startAttackLoop()

  function placeTurnTroop() {
    const owned = territories.filter((t) => t.owner === currentPlayer.id)

    // Priority 1: adjacent to human
    const priority1 = owned.filter((t) =>
      (adjacencyMap[t.id] || []).some((neighborId) => {
        const neighbor = territories.find((x) => x.id === neighborId)
        return neighbor && neighbor.owner === "human"
      })
    )

    // Priority 2: adjacent to other CPU
    const priority2 = owned.filter((t) =>
      (adjacencyMap[t.id] || []).some((neighborId) => {
        const neighbor = territories.find((x) => x.id === neighborId)
        return (
          neighbor &&
          neighbor.owner !== currentPlayer.id &&
          neighbor.owner?.startsWith("cpu")
        )
      })
    )

    // Priority 3: connector tiles in preferred continent
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

  function startAttackLoop() {
    logAction?.(`🔄 ${currentPlayer.name} begins attack phase...`)

    const runNextRound = () => {
      const fresh = structuredClone(territories)
      const attacks = getBestAttackSet(fresh)

      if (attacks.length === 0) {
        logAction?.(`🧠 No viable attacks found for ${currentPlayer.name}`)
        logAction?.(`🔄 ${currentPlayer.name} ends attack phase.`)
        memory.turnActive = false
        nextTurn()
        return
      }

      executeAttackSet(attacks, fresh, resolveBattle, () => {
        setTimeout(runNextRound, 400)
      })
    }

    runNextRound()
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

        logAction?.(
          `🧠 Considering ${from.name} (${from.troops}) → ${to.name} (${to.troops}) | Score: ${score}`
        )

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

  function executeAttackSet(attacks, currentTerritories, resolveBattle, onComplete) {
    function perform(index = 0) {
      if (index >= attacks.length) {
        onComplete()
        return
      }

      const { from, to } = attacks[index]
      const attacker = currentTerritories.find((t) => t.id === from)
      const defender = currentTerritories.find((t) => t.id === to)

      logAction?.(`🧾 CPU sees: ${attacker.name} (${attacker?.troops}) → ${defender.name} (${defender?.troops})`)
      logAction?.(`🧠 Executing attack from ${from} to ${to}`)

      resolveBattle(from, to)
      setTimeout(() => perform(index + 1), 400)
    }

    perform()
  }
}
