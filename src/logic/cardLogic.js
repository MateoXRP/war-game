// src/logic/cardLogic.js

// Expanded set of unique card flags
const FLAGS = ["🇺🇸", "🇨🇳", "🇷🇺", "🇬🇧", "🇧🇷", "🇫🇷", "🇯🇵", "🇩🇪", "🇮🇳"]

function getRandomFlag() {
  return FLAGS[Math.floor(Math.random() * FLAGS.length)]
}

export function drawAndCheckCards({
  playerId,
  playerCards,
  setPlayerCards,
  setsTurnedIn,
  setSetsTurnedIn,
  logAction,
}) {
  const card = getRandomFlag()
  logAction(`🃏 ${playerId} received a card: ${card}`)

  const updated = [...(playerCards[playerId] || []), card]
  const match = findMatch(updated)

  if (match) {
    logAction(`🎖️ ${playerId} matched 3 ${match} cards!`)
    const remaining = removeThreeMatchingCards(updated, match)
    const bonus = calculateBonus(setsTurnedIn)
    logAction(`➕ ${playerId} earned ${bonus} bonus troops!`)

    setPlayerCards((prev) => ({ ...prev, [playerId]: remaining }))
    setSetsTurnedIn((n) => n + 1)

    return bonus
  }

  setPlayerCards((prev) => ({ ...prev, [playerId]: updated }))
  return 0
}

function findMatch(cards) {
  const count = {}
  for (const c of cards) {
    count[c] = (count[c] || 0) + 1
    if (count[c] >= 3) return c  // 🔼 Match threshold increased to 3
  }
  return null
}

function removeThreeMatchingCards(cards, match) {
  let removed = 0
  return cards.filter((c) => {
    if (c === match && removed < 3) {
      removed++
      return false
    }
    return true
  })
}

function calculateBonus(sets) {
  return 4 + sets * 2
}
