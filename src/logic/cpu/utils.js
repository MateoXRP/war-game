// src/logic/cpu/utils.js
import { adjacencyMap, connectorPairs } from "../../data/territoryGraph"

export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function groupByContinent(territories) {
  const map = {}
  for (const t of territories) {
    if (!map[t.continent]) map[t.continent] = []
    map[t.continent].push(t)
  }
  return map
}

export function getContinent(id, territories) {
  const t = territories.find((x) => x.id === id)
  return t?.continent || null
}

export function getAdjacentContinents(targetContinent, territories) {
  const adjacent = new Set()
  for (const [a, b] of connectorPairs) {
    const aCont = getContinent(a, territories)
    const bCont = getContinent(b, territories)
    if (aCont === targetContinent && bCont !== targetContinent) adjacent.add(bCont)
    if (bCont === targetContinent && aCont !== targetContinent) adjacent.add(aCont)
  }
  return [...adjacent]
}

export function isAdjacentToEnemy(id, allTerritories, cpuId) {
  const neighbors = adjacencyMap[id] || []
  return neighbors.some((neighborId) => {
    const neighbor = allTerritories.find((t) => t.id === neighborId)
    return neighbor && neighbor.owner && neighbor.owner !== cpuId
  })
}

export function isPlayerEliminated(territories, playerId) {
  return !territories.some((t) => t.owner === playerId)
}

