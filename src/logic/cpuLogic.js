// src/logic/cpuLogic.js
import { handleClaimPhase } from "./cpu/claimLogic"
import { handleReinforcementLoop } from "./cpu/reinforceLogic"
import { handleTurnPhaseLoop } from "./cpu/attackLogic"
import { isPlayerEliminated } from "./cpu/utils"

const cpuMemory = {
  cpu1: { continent: null, reinforceIndex: 0, turnActive: false },
  cpu2: { continent: null, reinforceIndex: 0, turnActive: false },
}

export function handleCpuTurn({
  territories,
  setTerritories,
  currentPlayer,
  nextTurn,
  isPlacementPhase,
  isReinforcementPhase,
  isTurnPhase,
  reinforcements,
  setReinforcements,
  resolveBattle,
}) {
  const memory = cpuMemory[currentPlayer.id]

  // ✅ Skip eliminated players after placement phase
  if (!isPlacementPhase && isPlayerEliminated(territories, currentPlayer.id)) {
    console.log(`💀 ${currentPlayer.name} has been eliminated. Skipping turn.`)
    if (memory) {
      memory.turnActive = false // ✅ reset flag so CPU doesn't get stuck
    }
    nextTurn()
    return
  }

  if (isPlacementPhase) {
    return handleClaimPhase({
      territories,
      setTerritories,
      currentPlayer,
      nextTurn,
      memory,
    })
  }

  if (isReinforcementPhase && reinforcements[currentPlayer.id] > 0) {
    return handleReinforcementLoop({
      territories,
      setTerritories,
      currentPlayer,
      nextTurn,
      reinforcements,
      setReinforcements,
      memory,
    })
  }

  if (isTurnPhase) {
    return handleTurnPhaseLoop({
      territories,
      setTerritories,
      currentPlayer,
      nextTurn,
      reinforcements,
      setReinforcements,
      resolveBattle,
      memory,
    })
  }
}

