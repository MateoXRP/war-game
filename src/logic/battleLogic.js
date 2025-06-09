// src/logic/battleLogic.js
function rollDie() {
  return Math.floor(Math.random() * 6) + 1
}

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

  if (!attacker || !defender || attacker.troops < 2) return

  const attackerDice = Math.min(3, attacker.troops - 1)
  const defenderDice = Math.min(2, defender.troops)

  const attackRolls = Array.from({ length: attackerDice }, rollDie).sort((a, b) => b - a)
  const defenseRolls = Array.from({ length: defenderDice }, rollDie).sort((a, b) => b - a)

  let attackerLosses = 0
  let defenderLosses = 0

  for (let i = 0; i < Math.min(attackRolls.length, defenseRolls.length); i++) {
    if (attackRolls[i] > defenseRolls[i]) {
      defenderLosses++
    } else {
      attackerLosses++
    }
  }

  const defenderRemaining = defender.troops - defenderLosses
  const conquered = defenderRemaining <= 0

  setTerritories((prev) =>
    prev.map((t) => {
      if (t.id === attacker.id) {
        return { ...t, troops: t.troops - attackerLosses }
      }
      if (t.id === defender.id) {
        return conquered
          ? {
              ...t,
              owner: attacker.owner,
              troops: attackerDice - attackerLosses,
            }
          : { ...t, troops: defenderRemaining }
      }
      return t
    })
  )

  const defenderPlayer = playerOrder?.find((p) => p.id === defender.owner)
  const defenderName = defenderPlayer?.name || `Player ${defender.owner}`

  logAction(
    `⚔️ ${currentPlayer.name} attacked ${defenderName} on ${defender.name} from ${attacker.name}. Losses: A${attackerLosses}/D${defenderLosses}`
  )
  if (conquered) {
    logAction(`🏳️ ${currentPlayer.name} conquered ${defender.name}`)
  }

  setSelectedSource(null)
  setSelectedTarget(null)
}

