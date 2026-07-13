import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          dim: "var(--primary-dim)",
          pale: "var(--primary-pale)",
        },
        brand: {
          navy:        "#001529",
          'navy-light':"#002847",
          'navy-card': "#0a2540",
          yellow:      "#F5C518",
          'yellow-dim':"#c9a000",
          'yellow-pale':"rgba(245,197,24,0.12)",
          white:       "#ffffff",
          muted:       "rgba(255,255,255,0.45)",
          border:      "rgba(255,255,255,0.08)",
        }
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(0,0,0,0.3)',
        'yellow':  '0 8px 25px -4px rgba(245,197,24,0.4)',
        'card':    '0 2px 16px rgba(0,0,0,0.4)',
      },
      borderRadius: { '2xl':'1rem','3xl':'1.5rem' }
    },
  },
  plugins: [],
};
