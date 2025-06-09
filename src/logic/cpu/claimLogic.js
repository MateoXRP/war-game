// src/logic/cpu/claimLogic.js
import {
  connectorPairs,
  entryPointsByContinent,
  adjacencyMap,
} from "../../data/territoryGraph"
import {
  getContinent,
  getAdjacentContinents,
  randomPick,
  groupByContinent,
} from "./utils"

export function handleClaimPhase({
  territories,
  setTerritories,
  currentPlayer,
  nextTurn,
  memory,
}) {
  const unclaimed = territories.filter((t) => !t.owner)
  if (unclaimed.length === 0) return

  const continentMap = groupByContinent(territories)

  // First time: pick a preferred continent
  if (!memory.continent) {
    const emptyContinent = Object.entries(continentMap).find(
      ([, group]) => group.every((t) => !t.owner)
    )
    if (emptyContinent) {
      memory.continent = emptyContinent[0]
    }
  }

  const preferredContinent = memory.continent

  // 1. Prefer unclaimed in preferred continent
  const preferredUnclaimed = continentMap[preferredContinent]?.filter((t) => !t.owner)
  if (preferredUnclaimed?.length > 0) {
    return claim(randomPick(preferredUnclaimed))
  }

  // 2. Try connector territories adjacent to preferred continent
  const connectorCandidates = unclaimed.filter((t) =>
    isConnectorToPreferredContinent(t.id, preferredContinent)
  )
  if (connectorCandidates.length > 0) {
    return claim(randomPick(connectorCandidates))
  }

  // 3. Try unclaimed territories adjacent to connectors of preferred continent
  const adjacentToConnector = getAdjacentToConnectorCandidates(unclaimed, preferredContinent)
  if (adjacentToConnector.length > 0) {
    return claim(randomPick(adjacentToConnector))
  }

  // 4. Try unclaimed in adjacent continents
  const adjacentContinents = getAdjacentContinents(preferredContinent, territories)
  const adjacentUnclaimed = unclaimed.filter((t) =>
    adjacentContinents.includes(t.continent)
  )
  if (adjacentUnclaimed.length > 0) {
    return claim(randomPick(adjacentUnclaimed))
  }

  // 5. Fallback: pick any unclaimed
  return claim(randomPick(unclaimed))

  function claim(territory) {
    setTerritories((prev) =>
      prev.map((t) =>
        t.id === territory.id
          ? { ...t, owner: currentPlayer.id, troops: 1 }
          : t
      )
    )
    nextTurn()
  }

  function isConnectorToPreferredContinent(id, preferredContinent) {
    return connectorPairs.some(([a, b]) => {
      const aContinent = getContinent(a, territories)
      const bContinent = getContinent(b, territories)
      return (
        (a === id && bContinent === preferredContinent) ||
        (b === id && aContinent === preferredContinent)
      )
    })
  }

  function getAdjacentToConnectorCandidates(unclaimed, preferredContinent) {
    const results = []
    const validContinents = new Set(getAdjacentContinents(preferredContinent, territories))

    for (const [a, b] of connectorPairs) {
      const connectorId =
        getContinent(a, territories) === preferredContinent
          ? b
          : getContinent(b, territories) === preferredContinent
          ? a
          : null

      if (!connectorId) continue

      const connectorContinent = getContinent(connectorId, territories)
      if (!validContinents.has(connectorContinent)) continue

      const neighbors = adjacencyMap[connectorId] || []
      for (const neighborId of neighbors) {
        const tile = unclaimed.find((t) => t.id === neighborId)
        if (tile && validContinents.has(tile.continent)) {
          results.push(tile)
        }
      }
    }

    return results
  }
}

