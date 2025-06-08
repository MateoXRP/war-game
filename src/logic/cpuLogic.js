// src/logic/cpuLogic.js
import {
  adjacencyMap,
  connectorPairs,
  entryPointsByContinent,
} from "../data/territoryGraph"

const cpuMemory = {
  cpu1: { continent: null, reinforceIndex: 0, remainingTurnTroops: null, turnActive: false },
  cpu2: { continent: null, reinforceIndex: 0, remainingTurnTroops: null, turnActive: false },
}

function isAdjacentToEnemy(id, allTerritories, cpuId) {
  const neighbors = adjacencyMap[id] || []
  return neighbors.some((neighborId) => {
    const neighbor = allTerritories.find((t) => t.id === neighborId)
    return neighbor && neighbor.owner && neighbor.owner !== cpuId
  })
}

export function handleCpuTurn({
  territories,
  setTerritories,
  currentPlayer,
  nextTurn,
  isPlacementPhase,
  isReinforcementPhase,
  isTurnPhase,
  reinforcements,
  setReinforcements,
  resolveBattle,
}) {
  if (isPlacementPhase) return handleClaimPhase()
  if (isReinforcementPhase && reinforcements[currentPlayer.id] > 0) {
    return handleReinforcementLoop()
  }
  if (isTurnPhase && reinforcements[currentPlayer.id] > 0) {
    return handleTurnPhaseLoop()
  }

  function handleClaimPhase() {
    const unclaimed = territories.filter((t) => !t.owner)
    if (unclaimed.length === 0) return

    const continentMap = groupByContinent(territories)
    const memory = cpuMemory[currentPlayer.id]

    if (!memory.continent) {
      const emptyContinent = Object.entries(continentMap).find(
        ([, group]) => group.every((t) => !t.owner)
      )
      if (emptyContinent) {
        memory.continent = emptyContinent[0]
      }
    }

    const preferredContinent = memory.continent
    const preferredUnclaimed = continentMap[preferredContinent]?.filter((t) => !t.owner)
    if (preferredUnclaimed?.length > 0) return claim(randomPick(preferredUnclaimed))

    const connectorCandidates = unclaimed.filter((t) =>
      isConnectorToPreferredContinent(t.id, preferredContinent)
    )
    if (connectorCandidates.length > 0) return claim(randomPick(connectorCandidates))

    const adjacentToConnector = getAdjacentToConnectorCandidates(unclaimed, preferredContinent)
    if (adjacentToConnector.length > 0) return claim(randomPick(adjacentToConnector))

    const adjacentContinents = getAdjacentContinents(preferredContinent)
    const adjacentUnclaimed = unclaimed.filter((t) =>
      adjacentContinents.includes(t.continent)
    )
    if (adjacentUnclaimed.length > 0) return claim(randomPick(adjacentUnclaimed))

    return claim(randomPick(unclaimed))
  }

  function handleReinforcementLoop() {
    const memory = cpuMemory[currentPlayer.id]

    const placeOneTroop = () => {
      if (reinforcements[currentPlayer.id] <= 0) return

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

      setReinforcements((prev) => {
        const remaining = prev[currentPlayer.id] - 1
        nextTurn()
        return {
          ...prev,
          [currentPlayer.id]: remaining,
        }
      })
    }

    setTimeout(placeOneTroop, 200)
  }

  function handleTurnPhaseLoop() {
    const memory = cpuMemory[currentPlayer.id]
    if (memory.turnActive) return
    memory.turnActive = true

    const performAttacks = () => {
      const owned = territories.filter(t => t.owner === currentPlayer.id && t.troops > 1)

      const attackPairs = []
      for (const from of owned) {
        const neighbors = adjacencyMap[from.id] || []
        const enemies = neighbors
          .map(id => territories.find(t => t.id === id))
          .filter(t => t && t.owner !== currentPlayer.id)
        if (enemies.length > 0) {
          const weakest = enemies.reduce((a, b) => (a.troops < b.troops ? a : b))
          attackPairs.push({ from: from.id, to: weakest.id })
        }
      }

      if (attackPairs.length === 0) {
        memory.turnActive = false
        nextTurn()
        return
      }

      const { from, to } = attackPairs[0]
      const fromTerritory = territories.find(t => t.id === from)
      const toTerritory = territories.find(t => t.id === to)

      console.log(
        `🪖 ${currentPlayer.name} attacks from ${fromTerritory.name} (${fromTerritory.troops}) → ${toTerritory.name} (${toTerritory.troops} owned by ${toTerritory.owner})`
      )

      resolveBattle(from, to)

      setTimeout(() => {
        memory.turnActive = false
        nextTurn()
      }, 350)
    }

    performAttacks()
  }

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

  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function groupByContinent(territories) {
    const map = {}
    for (const t of territories) {
      if (!map[t.continent]) map[t.continent] = []
      map[t.continent].push(t)
    }
    return map
  }

  function isConnectorToPreferredContinent(id, preferredContinent) {
    return connectorPairs.some(([a, b]) => {
      const aContinent = getContinent(a)
      const bContinent = getContinent(b)
      return (
        (a === id && bContinent === preferredContinent) ||
        (b === id && aContinent === preferredContinent)
      )
    })
  }

  function getContinent(id) {
    const t = territories.find((x) => x.id === id)
    return t?.continent || null
  }

  function getAdjacentContinents(targetContinent) {
    const adjacent = new Set()
    for (const [a, b] of connectorPairs) {
      const aCont = getContinent(a)
      const bCont = getContinent(b)
      if (aCont === targetContinent && bCont !== targetContinent) adjacent.add(bCont)
      if (bCont === targetContinent && aCont !== targetContinent) adjacent.add(aCont)
    }
    return [...adjacent]
  }

  function getAdjacentToConnectorCandidates(unclaimed, preferredContinent) {
    const results = []
    const validContinents = new Set(getAdjacentContinents(preferredContinent))

    for (const [a, b] of connectorPairs) {
      const connectorId = getContinent(a) === preferredContinent ? b :
                          getContinent(b) === preferredContinent ? a : null

      if (!connectorId) continue

      const connectorContinent = getContinent(connectorId)
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

