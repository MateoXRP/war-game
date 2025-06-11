// src/context/GameContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { initialTerritories, players as basePlayers } from "../data/gameData"
import { resolveBattle as battleLogic } from "../logic/battleLogic"
import { handleCpuTurn } from "../logic/cpuLogic"
import {
  handlePlacementToReinforcement,
  handleReinforcementToTurn,
  handleTurnStartTroops,
} from "../logic/phaseLogic"
import { useSelection } from "../hooks/useSelection"
import { useLog } from "./LogContext"
import { db } from "../firebase"
import { doc, setDoc, updateDoc, getDoc, increment } from "firebase/firestore"
import { drawAndCheckCards } from "../logic/cardLogic"

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
  const [conqueredThisTurn, setConqueredThisTurn] = useState(false)
  const [playerCards, setPlayerCards] = useState({
    human: [],
    cpu1: [],
    cpu2: [],
  })
  const [setsTurnedIn, setSetsTurnedIn] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

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
    if (!playerOrder || territories.length === 0) return
    setConqueredThisTurn(false)

    let nextIndex = turnIndex + 1
    let safety = 0
    while (safety < 10) {
      const nextPlayer = playerOrder[nextIndex % playerOrder.length]
      const ownsTiles =
        isPlacementPhase || territories.some(t => t.owner === nextPlayer.id)

      if (ownsTiles) {
        setTurnIndex(nextIndex)
        resetSelection()
        return
      }

      nextIndex++
      safety++
    }

    console.warn("No valid players found for next turn.")
  }

  async function recordGameResult(outcome) {
    const playerName = localStorage.getItem("playerName")
    if (!playerName) return

    const statsRef = doc(db, "war_leaderboard", playerName)

    try {
      const snap = await getDoc(statsRef)
      if (!snap.exists()) {
        await setDoc(statsRef, {
          name: playerName,
          wins: outcome === "win" ? 1 : 0,
          losses: outcome === "loss" ? 1 : 0,
        })
      } else {
        await updateDoc(statsRef, {
          [outcome === "win" ? "wins" : "losses"]: increment(1),
        })
      }
    } catch (err) {
      console.error("Failed to record game result:", err)
    }
  }

  useEffect(() => {
    if (!playerOrderRef.current) {
      const rolls = basePlayers.map((p) => ({ ...p, roll: rollDie() }))
      rolls.sort((a, b) => b.roll - a.roll)
      playerOrderRef.current = rolls
      setPlayerOrder(rolls)

      const initialReinforcements = {}
      rolls.forEach((p) => {
        initialReinforcements[p.id] = 35
      })
      setReinforcements(initialReinforcements)

      setStartTime(Date.now())
      setElapsedSeconds(0)
    }
  }, [])

  useEffect(() => {
    if (!startTime || gameOver) return

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, gameOver])

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

    const shouldRunPlacement = isPlacementPhase && turnIndex !== lastCpuPlacementTurn
    const shouldRunReinforcement = isReinforcementPhase && reinforcements[currentPlayer.id] > 0
    const shouldRunTurn = isTurnPhase && reinforcements[currentPlayer.id] > 0

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
    if (!isTurnPhase || !playerOrderRef.current || playerOrderRef.current.length === 0)
      return

    const activePlayers = playerOrderRef.current.filter((p) =>
      territories.some((t) => t.owner === p.id)
    )

    if (!gameOver) {
      if (activePlayers.length === 1) {
        setGameOver(true)
        setWinner(activePlayers[0])
        recordGameResult(activePlayers[0].id === "human" ? "win" : "loss")
      } else {
        const humanAlive = territories.some((t) => t.owner === "human")
        if (!humanAlive) {
          const survivingCPU = activePlayers.find((p) => p.id !== "human")
          setGameOver(true)
          setWinner(survivingCPU || null)
          recordGameResult("loss")
        }
      }
    }
  }, [territories, gameOver, isTurnPhase])

  function resolveBattle(attackerId, defenderId) {
    const before = territories.find((t) => t.id === defenderId)?.owner
    const conquered = battleLogic({
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
    const after = territories.find((t) => t.id === defenderId)?.owner

    if (before && after && before !== after && after === currentPlayer.id) {
      setConqueredThisTurn(true)

      const bonus = drawAndCheckCards({
        playerId: currentPlayer.id,
        playerCards,
        setPlayerCards,
        setsTurnedIn,
        setSetsTurnedIn,
        logAction,
      })

      if (!currentPlayer.isCPU && bonus > 0) {
        setReinforcements((prev) => ({
          ...prev,
          [currentPlayer.id]: (prev[currentPlayer.id] || 0) + bonus,
        }))
      } else if (bonus > 0) {
        logAction(`🧠 ${currentPlayer.name} banked ${bonus} bonus troops for next turn`)
      }
    }

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
        playerCards,
        setsTurnedIn,
        elapsedSeconds,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => useContext(GameContext)
