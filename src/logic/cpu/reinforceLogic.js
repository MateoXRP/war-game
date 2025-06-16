// src/logic/cpu/reinforceLogic.js
import { entryPointsByContinent, adjacencyMap } from "../../data/territoryGraph"

export function handleReinforcementLoop({
  territories,
  setTerritories,
  currentPlayer,
  nextTurn,
  reinforcements,
  setReinforcements,
  memory,
  logAction,
}) {
  if (reinforcements[currentPlayer.id] <= 0) {
    nextTurn()
    return
  }

  const owned = territories.filter((t) => t.owner === currentPlayer.id)

  // Priority 1: territories adjacent to human player
  const priority1 = owned.filter((t) =>
    (adjacencyMap[t.id] || []).some((neighborId) => {
      const neighbor = territories.find((x) => x.id === neighborId)
      return neighbor && neighbor.owner === "human"
    })
  )

  // Priority 2: territories adjacent to other CPU
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
      t.id === target.id ? { ...t, troops: (t.troops || 0) + 1 } : t
    )
  )

  logAction?.(`➕ ${currentPlayer.name} reinforced ${target.name}`)

  setReinforcements((prev) => ({
    ...prev,
    [currentPlayer.id]: prev[currentPlayer.id] - 1,
  }))

  // ✅ One troop per CPU per round, like the human player
  nextTurn()
}
