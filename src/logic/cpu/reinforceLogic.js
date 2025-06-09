// src/logic/cpu/reinforceLogic.js
import { entryPointsByContinent } from "../../data/territoryGraph"
import { isAdjacentToEnemy, randomPick } from "./utils"

export function handleReinforcementLoop({
  territories,
  setTerritories,
  currentPlayer,
  nextTurn,
  reinforcements,
  setReinforcements,
  memory,
  logAction,
}) {
  const placeOneTroop = () => {
    if (reinforcements[currentPlayer.id] <= 0) return

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

    logAction?.(`➕ ${currentPlayer.name} reinforced ${target.name}`)

    setReinforcements((prev) => {
      const remaining = prev[currentPlayer.id] - 1
      nextTurn()
      return {
        ...prev,
        [currentPlayer.id]: remaining,
      }
    })
  }

  setTimeout(placeOneTroop, 200)
}

