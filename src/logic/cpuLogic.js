const cpuMemory = {
  cpu1: { continent: null, reinforceIndex: 0 },
  cpu2: { continent: null, reinforceIndex: 0 },
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

      // 1. Unclaimed in preferred continent
      const preferredUnclaimed = continentMap[preferredContinent]?.filter((t) => !t.owner)
      if (preferredUnclaimed?.length > 0) {
        return claim(randomPick(preferredUnclaimed))
      }

      // 2. Unclaimed connector territory to preferred continent
      const connectorCandidates = unclaimed.filter((t) =>
        isConnectorToPreferredContinent(t.id, preferredContinent)
      )
      if (connectorCandidates.length > 0) {
        return claim(randomPick(connectorCandidates))
      }

      // 2.5. Adjacent to connectors to preferred continent
      const adjacentToConnector = getAdjacentToConnectorCandidates(unclaimed, preferredContinent)
      if (adjacentToConnector.length > 0) {
        return claim(randomPick(adjacentToConnector))
      }

      // 3. Any unclaimed in adjacent continents
      const adjacentContinents = getAdjacentContinents(preferredContinent)
      const adjacentUnclaimed = unclaimed.filter((t) =>
        adjacentContinents.includes(t.continent)
      )
      if (adjacentUnclaimed.length > 0) {
        return claim(randomPick(adjacentUnclaimed))
      }

      // 4. Fallback
      return claim(randomPick(unclaimed))
    }

    function handleReinforcementPhase() {
      const memory = cpuMemory[currentPlayer.id]
      const preferredContinent = memory.continent
      const owned = territories.filter((t) => t.owner === currentPlayer.id)

      const inContinent = owned.filter((t) => t.continent === preferredContinent)
      const fullControl =
        inContinent.length === 9 &&
        territories
          .filter((t) => t.continent === preferredContinent)
          .every((t) => t.owner === currentPlayer.id)

      let targets = []

      if (fullControl) {
        const entryIds = entryPointsByContinent[preferredContinent] || []
        targets = inContinent.filter((t) => entryIds.includes(t.id))
      } else {
        const frontline = inContinent.filter((t) =>
          isAdjacentToEnemy(t, territories, currentPlayer.id)
        )

        const internalEntryPoints = inContinent.filter((t) =>
          (entryPointsByContinent[preferredContinent] || []).includes(t.id)
        )

        const externalEntryPoints = owned.filter((t) =>
          isConnectorToPreferredContinent(t.id, preferredContinent)
        )

        const merged = [...frontline, ...internalEntryPoints, ...externalEntryPoints]
        const seen = new Set()
        targets = merged.filter((t) => {
          if (seen.has(t.id)) return false
          seen.add(t.id)
          return true
        })
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

    function isAdjacentToEnemy(tile, all, cpuId) {
      const continentTiles = all.filter((t) => t.continent === tile.continent)
      const index = continentTiles.findIndex((t) => t.id === tile.id)
      if (index === -1) return false

      const row = Math.floor(index / 3)
      const col = index % 3
      const adjacentCoords = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ]

      for (const [r, c] of adjacentCoords) {
        if (r >= 0 && r < 3 && c >= 0 && c < 3) {
          const adjIndex = r * 3 + c
          const adjTile = continentTiles[adjIndex]
          if (adjTile && adjTile.owner && adjTile.owner !== cpuId) {
            return true
          }
        }
      }
      return false
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

        const connectorTile = territories.find((t) => t.id === connectorId)
        if (!connectorTile) continue

        const continentTiles = territories.filter((t) => t.continent === connectorTile.continent)
        const index = continentTiles.findIndex((t) => t.id === connectorId)
        if (index === -1) continue

        const row = Math.floor(index / 3)
        const col = index % 3
        const adjacentCoords = [
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1],
        ]

        for (const [r, c] of adjacentCoords) {
          if (r >= 0 && r < 3 && c >= 0 && c < 3) {
            const adjIndex = r * 3 + c
            const adjTile = continentTiles[adjIndex]
            if (adjTile && !adjTile.owner) {
              results.push(adjTile)
            }
          }
        }
      }

      return results
    }
  }, 500)
}

