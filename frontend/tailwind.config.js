/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#ffffff',
        foreground: '#000000',
        muted: '#f5f5f5',
        'muted-foreground': '#737373',
      }
    },
  },
  plugins: [],
}
