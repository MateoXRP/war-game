// src/logic/phaseLogic.js

export function handlePlacementToReinforcement({
  territories,
  isPlacementPhase,
  playerOrderRef,
  setIsPlacementPhase,
  setIsReinforcementPhase,
  setReinforcements,
}) {
  const claimed = territories.filter((t) => t.owner).length
  if (isPlacementPhase && claimed >= territories.length) {
    setIsPlacementPhase(false)
    setIsReinforcementPhase(true)

    const counts = {}
    playerOrderRef.current.forEach((p) => {
      const owned = territories.filter((t) => t.owner === p.id).length
      counts[p.id] = Math.max(35 - owned, 0)
    })
    setReinforcements(counts)
  }
}

export function handleReinforcementToTurn({
  reinforcements,
  isReinforcementPhase,
  setIsReinforcementPhase,
  setIsTurnPhase,
}) {
  if (
    isReinforcementPhase &&
    Object.values(reinforcements).every((r) => r <= 0)
  ) {
    setIsReinforcementPhase(false)
    setIsTurnPhase(true)
  }
}

export function handleTurnStartTroops({
  isTurnPhase,
  currentPlayer,
  territories,
  turnIndex,
  troopsAwardedTurn,
  setReinforcements,
  setTroopsAwardedTurn,
}) {
  if (!isTurnPhase || !currentPlayer || turnIndex === troopsAwardedTurn) return

  const owned = territories.filter(t => t.owner === currentPlayer.id)
  const ownedIds = new Set(owned.map(t => t.id))

  const bonusByContinent = {
    "North America": 5,
    "Europe": 10,
    "Asia": 5,
    "South America": 5,
    "Africa": 10,
    "Australia": 5,
  }

  let continentBonus = 0
  for (const [continent, bonus] of Object.entries(bonusByContinent)) {
    const allInContinent = territories.filter(t => t.continent === continent).map(t => t.id)
    const fullyOwned = allInContinent.every(id => ownedIds.has(id))
    if (fullyOwned) {
      continentBonus += bonus
    }
  }

  const baseTroops = Math.max(3, Math.floor(owned.length / 3))
  const total = baseTroops + continentBonus

  setReinforcements(prev => ({
    ...prev,
    [currentPlayer.id]: total,
  }))
  setTroopsAwardedTurn(turnIndex)
}

