// src/logic/cpuLogic.js

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
  // CPU delay for realism
  setTimeout(() => {
    if (isPlacementPhase) {
      const unclaimed = territories.filter((t) => !t.owner)
      if (unclaimed.length === 0) return
      const pick = unclaimed[Math.floor(Math.random() * unclaimed.length)]

      setTerritories((prev) =>
        prev.map((t) =>
          t.id === pick.id ? { ...t, owner: currentPlayer.id, troops: 1 } : t
        )
      )
      nextTurn()
    }

    else if (isReinforcementPhase && reinforcements[currentPlayer.id] > 0) {
      const owned = territories.filter((t) => t.owner === currentPlayer.id)
      if (owned.length === 0) return
      const pick = owned[Math.floor(Math.random() * owned.length)]

      setTerritories((prev) =>
        prev.map((t) =>
          t.id === pick.id ? { ...t, troops: t.troops + 1 } : t
        )
      )
      setReinforcements((prev) => ({
        ...prev,
        [currentPlayer.id]: prev[currentPlayer.id] - 1,
      }))
      nextTurn()
    }
  }, 500)
}

