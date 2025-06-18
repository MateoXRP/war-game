// src/logic/battleLogic.js
import { flagByTerritoryId } from "../data/territoryGraph"

export function resolveBattle({
  attackerId,
  defenderId,
  territories,
  currentPlayer,
  logAction,
}) {
  const attacker = territories.find((t) => t.id === attackerId)
  const defender = territories.find((t) => t.id === defenderId)

  if (!attacker || !defender) return { updatedTerritories: territories, conquered: false }

  const attackDice = []
  const defendDice = []

  const maxAttackDice = Math.min(attacker.troops - 1, 3)
  const maxDefendDice = Math.min(defender.troops, 2)

  for (let i = 0; i < maxAttackDice; i++) {
    attackDice.push(Math.floor(Math.random() * 6) + 1)
  }

  for (let i = 0; i < maxDefendDice; i++) {
    defendDice.push(Math.floor(Math.random() * 6) + 1)
  }

  attackDice.sort((a, b) => b - a)
  defendDice.sort((a, b) => b - a)

  let attackerLosses = 0
  let defenderLosses = 0

  for (let i = 0; i < Math.min(attackDice.length, defendDice.length); i++) {
    if (attackDice[i] > defendDice[i]) {
      defenderLosses++
    } else {
      attackerLosses++
    }
  }

  attacker.troops -= attackerLosses
  defender.troops -= defenderLosses

  logAction(
    `⚔️ ${currentPlayer.name} attacked ${defender.name} from ${attacker.name}. Losses: A${attackerLosses}/D${defenderLosses}`
  )

  let conquered = false

  if (defender.troops <= 0) {
    defender.owner = attacker.owner

    let moveIn = Math.min(attacker.troops - 1, attackDice.length)
    if (moveIn <= 0) moveIn = 1

    defender.troops = moveIn
    attacker.troops -= moveIn

    const conqueredFlag = flagByTerritoryId[defender.id] || "🏳️"
    logAction(`${conqueredFlag} ${currentPlayer.name} conquered ${defender.name}`)

    conquered = true
  }

  const updatedTerritories = territories.map((t) => {
    if (t.id === attacker.id) return { ...attacker }
    if (t.id === defender.id) return { ...defender }
    return t
  })

  return { updatedTerritories, conquered }
}
