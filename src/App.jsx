import { useState } from "react"
import HomeScreen from "./screens/HomeScreen"
import WorldPhase from "./screens/WorldPhase"

function App() {
  const [screen, setScreen] = useState("home")

  const isCentered = screen === "home"
  const containerClass = isCentered
    ? "min-h-screen flex items-center justify-center"
    : "min-h-screen"

  return (
    <div className={`${containerClass} bg-background text-white p-4`}>
      {screen === "home" && <HomeScreen onStart={() => setScreen("world")} />}
      {screen === "world" && <WorldPhase />}
    </div>
  )
}

export default App

