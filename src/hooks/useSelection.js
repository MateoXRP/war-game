// src/hooks/useSelection.js
import { useState } from "react"

export function useSelection() {
  const [selectedSource, setSelectedSource] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)

  const resetSelection = () => {
    setSelectedSource(null)
    setSelectedTarget(null)
  }

  return {
    selectedSource,
    setSelectedSource,
    selectedTarget,
    setSelectedTarget,
    resetSelection,
  }
}

