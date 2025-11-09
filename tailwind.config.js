/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        backgroundSecondary: 'var(--backgroundSecondary)',
        backgroundMuted: 'var(--backgroundMuted)',
        foreground: 'var(--foreground)',
        foregroundSecondary: 'var(--foregroundSecondary)',
        foregroundMuted: 'var(--foregroundMuted)',
        card: 'var(--card)',
        cardForeground: 'var(--cardForeground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        primary: 'var(--primary)',
        primaryForeground: 'var(--primaryForeground)',
        secondary: 'var(--secondary)',
        secondaryForeground: 'var(--secondaryForeground)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
        text: 'var(--text)',
      },
    },
  },
  plugins: [],
}