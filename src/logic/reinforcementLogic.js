// src/logic/reinforcementLogic.js

export function calculateReinforcements(currentPlayer, territories) {
  const owned = territories.filter(t => t.owner === currentPlayer.id)
  const ownedIds = new Set(owned.map(t => t.id))

  const bonusByContinent = {
    "North America": 4,
    "Europe": 6,
    "Asia": 4,
    "South America": 4,
    "Africa": 6,
    "Australia": 4,
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
  return baseTroops + continentBonus
}

