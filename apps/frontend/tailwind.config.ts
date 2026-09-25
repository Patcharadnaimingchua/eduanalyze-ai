import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
          light: 'hsl(var(--brand-light))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Defined here rather than globals.css so they work with variants
      // (e.g. `before:animate-shimmer`).
      keyframes: {
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
        pop: {
          '0%': { transform: 'scale(0)' },
          '60%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        // Pair with pathLength={1} strokeDasharray={1} on the SVG shape.
        'radar-draw': {
          from: { strokeDashoffset: '1' },
          to: { strokeDashoffset: '0' },
        },
        'radar-fill': {
          from: { fillOpacity: '0' },
          to: { fillOpacity: '0.2' },
        },
        'radar-dot': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        // Delayed so it lands after the toast's 300ms slide-in.
        pop: 'pop 400ms ease-out 200ms both',
        // Outline draws first, then the fill and vertex dots settle in.
        'radar-shape': 'radar-draw 900ms ease-out both, radar-fill 500ms ease-out 600ms both',
        'radar-dot': 'radar-dot 300ms ease-out 800ms both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
