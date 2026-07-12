/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#002627",
        "on-primary": "#ffffff",
        "primary-container": "#0f3d3e",
        "on-primary-container": "#7da8a8",
        "primary-fixed": "#beebeb",
        "primary-fixed-dim": "#a3cfcf",
        "on-primary-fixed": "#002020",
        "on-primary-fixed-variant": "#224d4e",

        "secondary": "#994614",
        "on-secondary": "#ffffff",
        "secondary-container": "#ff955e",
        "on-secondary-container": "#742e00",
        "secondary-fixed": "#ffdbcb",
        "secondary-fixed-dim": "#ffb692",
        "on-secondary-fixed": "#341100",
        "on-secondary-fixed-variant": "#793000",

        "tertiary": "#052812",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#1c3e26",
        "on-tertiary-container": "#84a98a",
        "tertiary-fixed": "#c5ecc9",
        "tertiary-fixed-dim": "#aad0ae",
        "on-tertiary-fixed": "#00210c",
        "on-tertiary-fixed-variant": "#2c4e34",

        "background": "#f6fbf5",
        "on-background": "#181d1a",
        
        "surface": "#f6fbf5",
        "on-surface": "#181d1a",
        "surface-variant": "#dfe4df",
        "on-surface-variant": "#404848",
        "surface-dim": "#d7dbd6",
        "surface-bright": "#f6fbf5",
        
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f5f0",
        "surface-container": "#ebefea",
        "surface-container-high": "#e5e9e4",
        "surface-container-highest": "#dfe4df",
        
        "inverse-surface": "#2c322e",
        "inverse-on-surface": "#edf2ed",
        "inverse-primary": "#a3cfcf",
        
        "outline": "#717978",
        "outline-variant": "#c0c8c8",
        "surface-tint": "#3b6566",
        
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        "rust-amber": "#E8A33D"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "sm": "0.125rem",
        "md": "0.375rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "stack-lg": "32px",
        "stack-xs": "4px",
        "margin-page": "24px",
        "container-max": "1440px",
        "stack-sm": "8px",
        "sidebar-width": "260px",
        "gutter": "16px",
        "stack-md": "16px"
      },
      fontFamily: {
        "body-lg": ["IBM Plex Sans", "sans-serif"],
        "label-caps": ["IBM Plex Mono", "monospace"],
        "body-md": ["IBM Plex Sans", "sans-serif"],
        "headline-xl": ["Space Grotesk", "sans-serif"],
        "body-sm": ["IBM Plex Sans", "sans-serif"],
        "data-mono": ["IBM Plex Mono", "monospace"],
        "headline-md": ["Space Grotesk", "sans-serif"],
        "headline-lg": ["Space Grotesk", "sans-serif"]
      },
      fontSize: {
        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "700"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-xl": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "data-mono": ["14px", {"lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "500"}],
        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
      }
    },
  },
  plugins: [],
}
