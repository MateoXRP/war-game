const cpuMemory = {
  cpu1: { continent: null, reinforceIndex: 0 },
  cpu2: { continent: null, reinforceIndex: 0 },
}

const entryPointsByContinent = {
  "North America": ["na6", "na8"],        // NYC, Costa Rica
  "Europe": ["eu4", "eu8", "eu6"],        // GBR, France, Ukraine
  "Asia": ["as4", "as8"],                 // Afghanistan, Thailand
  "South America": ["sa2", "sa6"],        // Columbia, Brazil
  "Africa": ["af2", "af4", "af6"],        // Libya, Nigeria, Somalia
  "Australia": ["au2", "au4"],            // Philippines, W Australia
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

    // --- Placement Phase ---
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

      const target = memory.continent

      if (target) {
        const targetTerritories = continentMap[target].filter((t) => !t.owner)
        if (targetTerritories.length > 0) {
          return claim(randomPick(targetTerritories))
        }
      }

      const contested = unclaimed.filter((t) => {
        const owners = new Set(
          territories
            .filter((x) => x.continent === t.continent && x.owner)
            .map((x) => x.owner)
        )
        return owners.size === 1 && !owners.has(currentPlayer.id)
      })

      if (contested.length > 0) return claim(randomPick(contested))
      return claim(randomPick(unclaimed))
    }

    // --- Reinforcement Phase ---
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
          Object.entries(entryPointsByContinent).some(([continent, ids]) => {
            if (continent === preferredContinent) return false
            return ids.includes(t.id) &&
              t.continent === continent &&
              connectsTo(t.id, preferredContinent)
          })
        )

        const merged = [...frontline, ...internalEntryPoints, ...externalEntryPoints]

        // De-duplicate targets
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

    function connectsTo(territoryId, targetContinent) {
      return Object.entries(entryPointsByContinent).some(([sourceContinent, ids]) => {
        return ids.includes(territoryId) &&
          sourceContinent !== targetContinent &&
          entryPointsByContinent[targetContinent]?.some(id => {
            const target = territories.find(t => t.id === id)
            return target?.continent === targetContinent
          })
      })
    }
  }, 500)
}

