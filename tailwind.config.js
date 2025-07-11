/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      dropShadow: {
        gold: '0 0 20px rgba(255, 215, 0, 0.8)',
      },
      colors: {
        parchment: '#f1e6d0',
        medieval: {
          brown: '#2d1b10',
          gold: '#d4af37',
          red: '#6e1e1e',
        },
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'], // tu peux remplacer par MedievalSharp ou Uncial Antiqua si installée
      },
    },
  },
  plugins: [],
};
