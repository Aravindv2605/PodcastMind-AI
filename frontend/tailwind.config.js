/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D12",
        surface: "#13131A",
        primary: "#7B5EFF",
        secondary: "#FF5E9C",
        "text-primary": "#FFFFFF",
        "text-muted": "#8888AA",
        success: "#00E5A0",
        warning: "#FF8C42",
      },
      fontFamily: {
        sans: ["Inter", "DM Sans", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Sora", "sans-serif"],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #7B5EFF 0%, #FF5E9C 100%)',
        'dark-gradient': 'linear-gradient(180deg, #13131A 0%, #0D0D12 100%)',
      },
      boxShadow: {
        'neon-purple': '0 0 15px rgba(123, 94, 255, 0.3)',
        'neon-pink': '0 0 15px rgba(255, 94, 156, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
