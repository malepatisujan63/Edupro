/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        x: {
          bg: '#000000',
          'bg-light': '#ffffff',
          surface: '#16181c',
          'surface-light': '#f7f9f9',
          border: '#2f3336',
          'border-light': '#eff3f4',
          subtext: '#71767b',
          'subtext-light': '#536471',
          text: '#f7f9f9',
          'text-light': '#0f1419',
          accent: '#12BEF9',
          'accent-blue': '#1A75F2',
          'accent-purple': '#7544EC',
          'accent-magenta': '#BC5AFC',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'Consolas', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'x-button': '0 2px 10px rgba(0, 0, 0, 0.2)',
        'x-glow': '0 0 20px rgba(18, 190, 249, 0.4)',
      },
    },
  },
  plugins: [],
};
