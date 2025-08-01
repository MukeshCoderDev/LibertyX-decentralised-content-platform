/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#0D0D0F',
        'primary': '#FF0050',
        'card': '#1A1A1D',
        'text-main': '#FFFFFF',
        'text-secondary': '#A0A0A0',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'satoshi': ['Satoshi', 'sans-serif'],
      },
      keyframes: {
        confetti: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(100px) scale(0)', opacity: '0' },
        },
      },
      animation: {
        confetti: 'confetti 1s ease-out forwards',
      },
    }
  },
  plugins: [],
}