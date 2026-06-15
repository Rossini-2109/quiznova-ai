// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: "#F8FAFC",
        glass: "rgba(255,255,255,0.2)"
      },
      backdropBlur: {
        xs: "2px"
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)"
      },
      borderRadius: {
        xl: "1.5rem"
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite"
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" }
        }
      }
    }
  },
  plugins: []
};
