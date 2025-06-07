const cpuMemory = {
  cpu1: { continent: null, reinforceIndex: 0 },
  cpu2: { continent: null, reinforceIndex: 0 },
}

const adjacencyMap = {
  na1: ["na2", "na4"],
  na2: ["na1", "na3", "na5"],
  na3: ["na2", "na6"],
  na4: ["na1", "na5", "na7"],
  na5: ["na2", "na4", "na6", "na8"],
  na6: ["na3", "na5", "na9", "eu4"],
  na7: ["na4", "na8"],
  na8: ["na5", "na7", "na9", "sa2"],
  na9: ["na6", "na8"],
  eu1: ["eu2", "eu4"],
  eu2: ["eu1", "eu3", "eu5"],
  eu3: ["eu2", "eu6"],
  eu4: ["eu1", "eu5", "eu7", "na6"],
  eu5: ["eu2", "eu4", "eu6", "eu8"],
  eu6: ["eu3", "eu5", "eu9", "as4"],
  eu7: ["eu4", "eu8"],
  eu8: ["eu5", "eu7", "eu9", "af2"],
  eu9: ["eu6", "eu8"],
  as1: ["as2", "as4"],
  as2: ["as1", "as3", "as5"],
  as3: ["as2", "as6"],
  as4: ["as1", "as5", "as7", "eu6"],
  as5: ["as2", "as4", "as6", "as8"],
  as6: ["as3", "as5", "as9"],
  as7: ["as4", "as8"],
  as8: ["as5", "as7", "as9", "au2"],
  as9: ["as6", "as8"],
  sa1: ["sa2", "sa4"],
  sa2: ["sa1", "sa3", "sa5", "na8"],
  sa3: ["sa2", "sa6"],
  sa4: ["sa1", "sa5", "sa7"],
  sa5: ["sa2", "sa4", "sa6", "sa8"],
  sa6: ["sa3", "sa5", "sa9", "af4"],
  sa7: ["sa4", "sa8"],
  sa8: ["sa5", "sa7", "sa9"],
  sa9: ["sa6", "sa8"],
  af1: ["af2", "af4"],
  af2: ["af1", "af3", "af5", "eu8"],
  af3: ["af2", "af6"],
  af4: ["af1", "af5", "af7", "sa6"],
  af5: ["af2", "af4", "af6", "af8"],
  af6: ["af3", "af5", "af9", "au4"],
  af7: ["af4", "af8"],
  af8: ["af5", "af7", "af9"],
  af9: ["af6", "af8"],
  au1: ["au2", "au4"],
  au2: ["au1", "au3", "au5", "as8"],
  au3: ["au2", "au6"],
  au4: ["au1", "au5", "au7", "af6"],
  au5: ["au2", "au4", "au6", "au8"],
  au6: ["au3", "au5", "au9"],
  au7: ["au4", "au8"],
  au8: ["au5", "au7", "au9"],
  au9: ["au6", "au8"],
}

const isAdjacentToEnemy = (tileId, territories, cpuId) => {
  const neighbors = adjacencyMap[tileId] || []
  return neighbors.some((id) => {
    const tile = territories.find((t) => t.id === id)
    return tile && tile.owner && tile.owner !== cpuId
  })
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
    if (isPlacementPhase) return handleClaimPhase()
    if (isReinforcementPhase && reinforcements[currentPlayer.id] > 0) {
      return handleReinforcementPhase()
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
      if (preferredUnclaimed?.length > 0) {
        return claim(randomPick(preferredUnclaimed))
      }

      const connectorCandidates = unclaimed.filter((t) =>
        isConnectorToPreferredContinent(t.id, preferredContinent)
      )
      if (connectorCandidates.length > 0) {
        return claim(randomPick(connectorCandidates))
      }

      const adjacentToConnector = getAdjacentToConnectorCandidates(unclaimed, preferredContinent)
      if (adjacentToConnector.length > 0) {
        return claim(randomPick(adjacentToConnector))
      }

      const adjacentContinents = getAdjacentContinents(preferredContinent)
      const adjacentUnclaimed = unclaimed.filter((t) =>
        adjacentContinents.includes(t.continent)
      )
      if (adjacentUnclaimed.length > 0) {
        return claim(randomPick(adjacentUnclaimed))
      }

      return claim(randomPick(unclaimed))
    }

    function handleReinforcementPhase() {
      const memory = cpuMemory[currentPlayer.id]
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
      nextTurn()
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
        if (a === id && bContinent === preferredContinent) return true
        if (b === id && aContinent === preferredContinent) return true
        return false
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
        if (aCont === targetContinent && bCont && bCont !== targetContinent)
          adjacent.add(bCont)
        if (bCont === targetContinent && aCont && aCont !== targetContinent)
          adjacent.add(aCont)
      }
      return [...adjacent]
    }

    function getAdjacentToConnectorCandidates(unclaimed, preferredContinent) {
      const results = []

      for (const [a, b] of connectorPairs) {
        const connectorId = (getContinent(a) === preferredContinent) ? b :
                            (getContinent(b) === preferredContinent) ? a : null

        if (!connectorId) continue

        const neighbors = adjacencyMap[connectorId] || []
        for (const neighborId of neighbors) {
          const tile = unclaimed.find((t) => t.id === neighborId)
          if (tile) results.push(tile)
        }
      }

      return results
    }
  }, 500)
}

const entryPointsByContinent = {
  "North America": ["na6", "na8"],
  "Europe": ["eu4", "eu8", "eu6"],
  "Asia": ["as4", "as8"],
  "South America": ["sa2", "sa6"],
  "Africa": ["af2", "af4", "af6"],
  "Australia": ["au2", "au4"],
}

const connectorPairs = [
  ["na8", "sa2"],
  ["na6", "eu4"],
  ["eu6", "as4"],
  ["eu8", "af2"],
  ["as8", "au2"],
  ["sa6", "af4"],
  ["af6", "au4"],
]

