function HomeScreen({ onStart }) {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-soft p-8 max-w-md w-full text-center">
      <h1 className="text-4xl font-bold mb-4">🌍 War Game</h1>
      <p className="text-gray-300 mb-6">
        Conquer the world against two CPU opponents. Classic strategy meets modern tactics.
      </p>
      <button
        onClick={onStart}
        className="bg-primary hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-2xl transition"
      >
        Start Game
      </button>
    </div>
  )
}

export default HomeScreen

