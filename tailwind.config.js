/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        paper: '#fff4e8',
        ink: '#2c211c',
        mist: '#7a5e50',
        line: '#f0d2bf',
        foam: '#fffaf5',
        blush: '#ffe3d2',
        sun: '#ff6a2c',
        grove: '#1f6b4a',
        berry: '#c23b4a',
      },
    },
  },
  plugins: [],
}
