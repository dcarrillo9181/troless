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
        paper: '#f3eee6',
        ink: '#1e1a16',
        mist: '#6d655d',
        line: '#e4dacd',
        tide: '#143330',
        clay: '#c4552a',
        foam: '#f7f3ec',
      },
    },
  },
  plugins: [],
}
