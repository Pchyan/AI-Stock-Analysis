/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        sans: 'var(--font-family-base)',
        heading: 'var(--font-family-heading)',
        mono: 'var(--font-family-mono)',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#1976d2",
          "secondary": "#2e7d32",
          "accent": "#f57c00",
          "neutral": "#212121",
          "base-100": "#f8f9fa",
          "info": "#0288d1",
          "success": "#2e7d32",
          "warning": "#ed6c02",
          "error": "#d32f2f",
        },
        dark: {
          "primary": "#42a5f5",
          "secondary": "#4caf50",
          "accent": "#ffb74d",
          "neutral": "#e0e0e0",
          "base-100": "#121212",
          "info": "#29b6f6",
          "success": "#66bb6a",
          "warning": "#ffa726",
          "error": "#ef5350",
        },
      },
    ],
    darkTheme: "dark",
  },
}
