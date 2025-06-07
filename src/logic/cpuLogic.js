// src/logic/cpuLogic.js

// In-memory target tracking per CPU
const cpuMemory = {
  cpu1: null,
  cpu2: null,
}

export function handleCpuTurn({
  territories,
  setTerritories,
  currentPlayer,
  nextTurn,
  isPlacementPhase,
  isReinforcementPhase,
  reinforcements,
  setReinforcements,
}) {
  setTimeout(() => {
    // ----- CLAIMING PHASE -----
    if (isPlacementPhase) {
      const unclaimed = territories.filter((t) => !t.owner)
      if (unclaimed.length === 0) return

      // Group by continent
      const continentMap = {}
      territories.forEach((t) => {
        if (!continentMap[t.continent]) continentMap[t.continent] = []
        continentMap[t.continent].push(t)
      })

      // Assign a target continent if not already assigned
      if (!cpuMemory[currentPlayer.id]) {
        const emptyContinent = Object.entries(continentMap).find(
          ([, group]) => group.every((t) => !t.owner)
        )
        if (emptyContinent) {
          cpuMemory[currentPlayer.id] = emptyContinent[0]
        }
      }

      const target = cpuMemory[currentPlayer.id]

      // Try to claim unowned territory in the target continent
      if (target) {
        const targetTerritories = continentMap[target].filter((t) => !t.owner)
        if (targetTerritories.length > 0) {
          const pick = randomPick(targetTerritories)
          return commitClaim(pick)
        }
      }

      // Otherwise, try to block other players by picking from contested continents
      const contestedTerritories = unclaimed.filter((t) => {
        const continent = continentMap[t.continent]
        const owners = new Set(continent.map((x) => x.owner).filter(Boolean))
        return owners.size === 1 && [...owners][0] !== currentPlayer.id
      })

      if (contestedTerritories.length > 0) {
        const pick = randomPick(contestedTerritories)
        return commitClaim(pick)
      }

      // Last resort: random pick
      const pick = randomPick(unclaimed)
      return commitClaim(pick)
    }

    // ----- REINFORCEMENT PHASE -----
    else if (isReinforcementPhase && reinforcements[currentPlayer.id] > 0) {
      const owned = territories.filter((t) => t.owner === currentPlayer.id)
      if (owned.length === 0) return

      // Prioritize frontlines (territories adjacent to enemies)
      const enemyTerritories = new Set(
        territories.filter((t) => t.owner && t.owner !== currentPlayer.id).map((t) => t.continent)
      )

      const frontlines = owned.filter((t) =>
        enemyTerritories.has(t.continent)
      )

      const reinforceTarget = randomPick(frontlines.length > 0 ? frontlines : owned)

      // Apply reinforcement
      setTerritories((prev) =>
        prev.map((t) =>
          t.id === reinforceTarget.id ? { ...t, troops: t.troops + 1 } : t
        )
      )
      setReinforcements((prev) => ({
        ...prev,
        [currentPlayer.id]: prev[currentPlayer.id] - 1,
      }))
      nextTurn()
    }

    function commitClaim(territory) {
      setTerritories((prev) =>
        prev.map((t) =>
          t.id === territory.id
            ? { ...t, owner: currentPlayer.id, troops: 1 }
            : t
        )
      )
      nextTurn()
    }

    function randomPick(arr) {
      return arr[Math.floor(Math.random() * arr.length)]
    }
  }, 500)
}

