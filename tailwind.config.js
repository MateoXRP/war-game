/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f0f0f",
        primary: "#22c55e",
        danger: "#ef4444",
      },
      borderRadius: {
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.2)",
      },
    },
  },
  plugins: [],
}

