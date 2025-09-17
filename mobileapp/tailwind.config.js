/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./.{js,jsx,ts,tsx}",          // main App file
    "./app/**/*.{js,jsx,ts,tsx}",      // expo-router folder (if using expo-router)
    "./src/**/*.{js,jsx,ts,tsx}",      // common convention
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",    // for some Next-like structures
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        purple: "#B01EFF",
        "purple-light": "#E1467C",
        secondary: "#EFF6FF",
        background: "",
        black: "#18181B",
        card: "#",
        error: "#f90000",
        foreground: "#71717A",
      },
      fontFamily: {
        bold: ["bold"],
        medium: ["medium"],
        regular: ["regular"],
        semibold: ["semibold"],
     },
     boxShadow: {
       'sm': '0 1px 0.5px 0.05px rgba(0, 0, 0, 0.05)',
     },
    },
  },
  plugins: [],
}
