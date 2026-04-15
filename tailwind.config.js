/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "tertiary-fixed-dim": "#b9c8db",
        "secondary": "#545f73",
        "on-secondary-container": "#586377",
        "inverse-surface": "#27313e",
        "on-tertiary-fixed": "#0e1d2b",
        "surface-bright": "#f8f9ff",
        "outline": "#727780",
        "on-surface-variant": "#41474f",
        "on-primary-fixed-variant": "#004a79",
        "surface-container-highest": "#d9e3f4",
        "on-secondary-fixed": "#111c2d",
        "secondary-container": "#d5e0f8",
        "primary-fixed": "#d0e4ff",
        "surface-container-lowest": "#ffffff",
        "surface-tint": "#52718a",
        "on-background": "#121c28",
        "on-secondary-fixed-variant": "#3c475a",
        "secondary-fixed-dim": "#bcc7de",
        "primary-container": "#4a5a6a",
        "on-tertiary-fixed-variant": "#3a4858",
        "primary-fixed-dim": "#9acbff",
        "on-primary": "#ffffff",
        "inverse-primary": "#9acbff",
        "surface-dim": "#d1dbec",
        "on-surface": "#121c28",
        "on-primary-fixed": "#001d34",
        "tertiary": "#3c4a5b",
        "surface-variant": "#d9e3f4",
        "surface-container-low": "#f1f4f9",
        "on-tertiary": "#ffffff",
        "on-error-container": "#93000a",
        "tertiary-fixed": "#d5e4f8",
        "tertiary-container": "#546273",
        "surface": "#f8faff",
        "primary": "#52718a",
        "outline-variant": "#c1c7d0",
        "on-error": "#ffffff",
        "secondary-fixed": "#d8e3fb",
        "on-tertiary-container": "#cfdef2",
        "error": "#ba1a1a",
        "inverse-on-surface": "#eaf1ff",
        "on-primary-container": "#c4dfff",
        "error-container": "#ffdad6",
        "on-secondary": "#ffffff",
        "surface-container-high": "#dfe9fa",
        "surface-container": "#e5eeff",
        "background": "#f8faff"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        "headline": ["Manrope"],
        "body": ["Inter"],
        "label": ["Inter"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
