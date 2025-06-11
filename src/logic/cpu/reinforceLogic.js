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

  const priorityTargets = owned.filter((t) =>
    (adjacencyMap[t.id] || []).some((neighborId) => {
      const neighbor = territories.find((x) => x.id === neighborId)
      return neighbor && neighbor.owner === "human"
    })
  )

  let targets = priorityTargets

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
      t.id === target.id ? { ...t, troops: (t.troops || 0) + 1 } : t
    )
  )

  logAction?.(`➕ ${currentPlayer.name} reinforced ${target.name}`)

  setReinforcements((prev) => ({
    ...prev,
    [currentPlayer.id]: prev[currentPlayer.id] - 1,
  }))

  // ✅ Immediately end turn after placing one troop
  nextTurn()
}
