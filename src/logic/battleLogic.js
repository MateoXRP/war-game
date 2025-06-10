// src/logic/battleLogic.js

export function resolveBattle({
  attackerId,
  defenderId,
  territories,
  currentPlayer,
  playerOrder,
  logAction,
  setTerritories,
  setSelectedSource,
  setSelectedTarget,
}) {
  const attacker = territories.find((t) => t.id === attackerId)
  const defender = territories.find((t) => t.id === defenderId)

  if (!attacker || !defender) return

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

  if (defender.troops <= 0) {
    defender.owner = attacker.owner
    const moveIn = attackDice.length
    defender.troops = moveIn
    attacker.troops -= moveIn
    logAction(`🏳️ ${currentPlayer.name} conquered ${defender.name}`)
  }

  // ✅ Deep clone to ensure state updates correctly
  setTerritories(prev => prev.map(t => ({ ...t })))
  setSelectedSource(null)
  setSelectedTarget(null)
}

