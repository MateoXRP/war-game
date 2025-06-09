// src/context/GameContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { initialTerritories, players as basePlayers } from "../data/gameData"
import { handleCpuTurn } from "../logic/cpuLogic"
import { resolveBattle as battleLogic } from "../logic/battleLogic"
import {
  handlePlacementToReinforcement,
  handleReinforcementToTurn,
  handleTurnStartTroops,
} from "../logic/phaseLogic"
import { useSelection } from "../hooks/useSelection"
import { useLog } from "./LogContext"

const GameContext = createContext()

function rollDie() {
  return Math.floor(Math.random() * 6) + 1
}

export function GameProvider({ children }) {
  const [territories, setTerritories] = useState(initialTerritories)
  const [turnIndex, setTurnIndex] = useState(0)
  const [playerOrder, setPlayerOrder] = useState(null)
  const [isPlacementPhase, setIsPlacementPhase] = useState(true)
  const [isReinforcementPhase, setIsReinforcementPhase] = useState(false)
  const [isTurnPhase, setIsTurnPhase] = useState(false)
  const [reinforcements, setReinforcements] = useState({})
  const [troopsAwardedTurn, setTroopsAwardedTurn] = useState(-1)
  const [lastCpuPlacementTurn, setLastCpuPlacementTurn] = useState(null)

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)

  const {
    selectedSource,
    setSelectedSource,
    selectedTarget,
    setSelectedTarget,
    resetSelection,
  } = useSelection()

  const { logAction } = useLog()
  const playerOrderRef = useRef(null)

  const currentPlayer = playerOrder ? playerOrder[turnIndex % playerOrder.length] : null

  const nextTurn = () => {
    setTurnIndex((prev) => prev + 1)
    resetSelection()
  }

  useEffect(() => {
    if (!playerOrderRef.current) {
      const rolls = basePlayers.map(p => ({ ...p, roll: rollDie() }))
      rolls.sort((a, b) => b.roll - a.roll)
      playerOrderRef.current = rolls
      setPlayerOrder(rolls)

      const initialReinforcements = {}
      rolls.forEach((p) => {
        initialReinforcements[p.id] = 35
      })
      setReinforcements(initialReinforcements)
    }
  }, [])

  useEffect(() => {
    handlePlacementToReinforcement({
      territories,
      isPlacementPhase,
      playerOrderRef,
      setIsPlacementPhase,
      setIsReinforcementPhase,
      setReinforcements,
    })
  }, [territories, isPlacementPhase])

  useEffect(() => {
    handleReinforcementToTurn({
      reinforcements,
      isReinforcementPhase,
      setIsReinforcementPhase,
      setIsTurnPhase,
    })
  }, [reinforcements, isReinforcementPhase])

  useEffect(() => {
    handleTurnStartTroops({
      isTurnPhase,
      currentPlayer,
      territories,
      turnIndex,
      troopsAwardedTurn,
      setReinforcements,
      setTroopsAwardedTurn,
    })
  }, [isTurnPhase, currentPlayer, territories, turnIndex, troopsAwardedTurn])

  useEffect(() => {
    const isCpu = currentPlayer?.isCPU
    if (!isCpu) return

    const shouldRunPlacement =
      isPlacementPhase && turnIndex !== lastCpuPlacementTurn

    const shouldRunReinforcement =
      isReinforcementPhase && reinforcements[currentPlayer.id] > 0

    const shouldRunTurn =
      isTurnPhase && reinforcements[currentPlayer.id] > 0

    if (shouldRunPlacement || shouldRunReinforcement || shouldRunTurn) {
      if (shouldRunPlacement) {
        setLastCpuPlacementTurn(turnIndex)
      }

      setTimeout(() => {
        handleCpuTurn({
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
          logAction,
        })
      }, 300)
    }
  }, [
    currentPlayer,
    isPlacementPhase,
    isReinforcementPhase,
    isTurnPhase,
    reinforcements,
    turnIndex,
    lastCpuPlacementTurn,
  ])

  useEffect(() => {
    if (
      !isTurnPhase ||
      !playerOrderRef.current ||
      playerOrderRef.current.length === 0
    ) return

    const activePlayers = playerOrderRef.current.filter((p) =>
      territories.some((t) => t.owner === p.id)
    )

    if (!gameOver) {
      if (activePlayers.length === 1) {
        setGameOver(true)
        setWinner(activePlayers[0])
      } else {
        const humanAlive = territories.some((t) => t.owner === "human")
        if (!humanAlive) {
          const survivingCPU = activePlayers.find((p) => p.id !== "human")
          setGameOver(true)
          setWinner(survivingCPU || null)
        }
      }
    }
  }, [territories, gameOver, isTurnPhase])

  function resolveBattle(attackerId, defenderId) {
    battleLogic({
      attackerId,
      defenderId,
      territories,
      currentPlayer,
      playerOrder,
      logAction,
      setTerritories,
      setSelectedSource,
      setSelectedTarget,
    })
    resetSelection()
  }

  return (
    <GameContext.Provider
      value={{
        territories,
        setTerritories,
        players: playerOrder || [],
        currentPlayer,
        nextTurn,
        isPlacementPhase,
        isReinforcementPhase,
        isTurnPhase,
        reinforcements,
        setReinforcements,
        selectedSource,
        setSelectedSource,
        selectedTarget,
        setSelectedTarget,
        resolveBattle,
        logAction,
        gameOver,
        winner,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => useContext(GameContext)

