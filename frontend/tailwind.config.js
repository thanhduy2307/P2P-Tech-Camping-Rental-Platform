/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-fixed": "#6ffbbe",
        "inverse-on-surface": "#eaf1ff",
        "on-secondary-fixed": "#001a42",
        "on-background": "#0b1c30",
        "surface-variant": "#d3e4fe",
        "on-primary-container": "#00422b",
        "secondary-container": "#2170e4",
        "surface-container-high": "#dce9ff",
        "on-primary": "#ffffff",
        "on-error-container": "#93000a",
        "inverse-surface": "#213145",
        "secondary-fixed-dim": "#adc6ff",
        "on-secondary-fixed-variant": "#004395",
        "on-tertiary-container": "#31394d",
        "surface-bright": "#f8f9ff",
        "primary-container": "#10b981",
        "on-primary-fixed-variant": "#005236",
        "on-error": "#ffffff",
        "surface-container-low": "#eff4ff",
        "on-primary-fixed": "#002113",
        "secondary": "#0058be",
        "on-secondary-container": "#fefcff",
        "primary-fixed-dim": "#4edea3",
        "tertiary": "#565e74",
        "on-secondary": "#ffffff",
        "on-surface-variant": "#3c4a42",
        "tertiary-container": "#9ba2bb",
        "tertiary-fixed": "#dae2fd",
        "surface-container-highest": "#d3e4fe",
        "surface-container": "#e5eeff",
        "on-tertiary-fixed-variant": "#3f465c",
        "inverse-primary": "#4edea3",
        "error-container": "#ffdad6",
        "surface-container-lowest": "#ffffff",
        "background": "#f8f9ff",
        "outline-variant": "#bbcabf",
        "surface": "#f8f9ff",
        "surface-tint": "#006c49",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed": "#131b2e",
        "on-surface": "#0b1c30",
        "outline": "#6c7a71",
        "surface-dim": "#cbdbf5",
        "primary": "#006c49",
        "tertiary-fixed-dim": "#bec6e0",
        "secondary-fixed": "#d8e2ff",
        "error": "#ba1a1a"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "container-max": "1280px",
        "margin-desktop": "40px",
        "base": "8px",
        "margin-mobile": "16px",
        "gutter": "24px"
      },
      fontFamily: {
        "body-lg": ["Inter", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "title-md": ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-sm": ["JetBrains Mono", "monospace"]
      },
      fontSize: {
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }]
      }
    }
  },
  plugins: [],
}
