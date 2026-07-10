/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0f1d',
          slate: '#111827',
          card: '#161e31',
          border: '#232f4e',
          accent: '#6366f1',
          neon: '#06b6d4',
          purple: '#a855f7',
          pink: '#ec4899',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px -5px rgba(99, 102, 241, 0.4)' },
          '100%': { boxShadow: '0 0 25px 5px rgba(6, 182, 212, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
