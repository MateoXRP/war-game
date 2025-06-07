// src/components/map/WorldMap.jsx
import { useGame } from "../../context/GameContext"

function WorldMap() {
  const {
    territories: state,
    setTerritories,
    currentPlayer,
    nextTurn,
    isPlacementPhase,
    isReinforcementPhase,
    reinforcements,
    setReinforcements,
  } = useGame()

  const handleClick = (id) => {
    const target = state.find((t) => t.id === id)
    if (!target) return

    // Phase 1: Claiming
    if (isPlacementPhase) {
      if (target.owner) return
      setTerritories((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, owner: currentPlayer.id, troops: 1 } : t
        )
      )
      nextTurn()
    }

    // Phase 2: Reinforcements
    else if (isReinforcementPhase) {
      if (target.owner !== currentPlayer.id) return
      if (reinforcements[currentPlayer.id] <= 0) return

      setTerritories((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, troops: t.troops + 1 } : t
        )
      )
      setReinforcements((prev) => ({
        ...prev,
        [currentPlayer.id]: prev[currentPlayer.id] - 1,
      }))
      nextTurn()
    }
  }

  const getOwnerColor = (ownerId) => {
    switch (ownerId) {
      case "human": return "fill-lime-500"
      case "cpu1": return "fill-red-500"
      case "cpu2": return "fill-blue-500"
      default: return "fill-gray-500"
    }
  }

  const positions = {}
  const gridSpacing = 120
  const globalOffset = { x: 80, y: 75 }

  const continentOffsets = {
    "North America": { x: 0, y: 0 },
    "Europe": { x: 3.5, y: 0 },
    "Asia": { x: 7, y: 0 },
    "South America": { x: 0, y: 3.5 },
    "Africa": { x: 3.5, y: 3.5 },
    "Australia": { x: 7, y: 3.5 },
  }

  Object.entries(continentOffsets).forEach(([continent, offset]) => {
    const group = state.filter((t) => t.continent === continent)
    group.forEach((t, i) => {
      const localRow = Math.floor(i / 3)
      const localCol = i % 3
      positions[t.id] = {
        x:
          (offset.x + localCol) * gridSpacing +
          globalOffset.x +
          localCol * 10 - 10,
        y: (offset.y + localRow) * gridSpacing + globalOffset.y,
      }
    })
  })

  const centerLines = [
    ["na5", "eu5"],
    ["eu5", "as5"],
    ["na5", "sa5"],
    ["eu5", "af5"],
    ["as5", "au5"],
    ["sa5", "af5"],
    ["af5", "au5"],
  ]

  return (
    <svg
      viewBox="0 0 1350 900"
      width="1100"
      height="750"
      className="rounded-xl bg-blue-800 mx-auto mb-2"
    >
      {centerLines.map(([from, to], index) => {
        const a = positions[from]
        const b = positions[to]
        if (!a || !b) return null

        const midX = (a.x + b.x) / 2 + 60
        const midY = (a.y + b.y) / 2 + 50

        return (
          <>
            <line
              key={`${index}-a`}
              x1={(a.x + 60 + midX) / 2}
              y1={(a.y + 50 + midY) / 2}
              x2={midX}
              y2={midY}
              stroke="yellow"
              strokeWidth="3"
            />
            <line
              key={`${index}-b`}
              x1={(b.x + 60 + midX) / 2}
              y1={(b.y + 50 + midY) / 2}
              x2={midX}
              y2={midY}
              stroke="yellow"
              strokeWidth="3"
            />
          </>
        )
      })}

      {state.map((t) => {
        const pos = positions[t.id]
        if (!pos) return null

        const fillClass = getOwnerColor(t.owner)
        const troopCount = t.troops || 0

        return (
          <g key={t.id} onClick={() => handleClick(t.id)} className="cursor-pointer">
            <rect
              x={pos.x}
              y={pos.y}
              width={120}
              height={100}
              rx="10"
              className={`${fillClass} stroke-white stroke-2`}
            />
            <text
              x={pos.x + 60}
              y={pos.y + 60}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              {t.name} ({troopCount})
            </text>
          </g>
        )
      })}

      {Object.entries(continentOffsets).map(([name, offset]) => {
        const labelX = (offset.x + 1.5) * gridSpacing + globalOffset.x
        const labelY = offset.y * gridSpacing + globalOffset.y - 20

        return (
          <g key={name}>
            <rect
              x={labelX - 60}
              y={labelY - 14}
              width={120}
              height={28}
              rx="6"
              fill="black"
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              fontSize="16"
              fill="white"
              fontWeight="bold"
              dominantBaseline="middle"
            >
              {name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default WorldMap

