/** @type {import('tailwindcss').Config} */
// ── Swarnix storefront — Tanishq-style warm-gold luxe theme ──────────
// All bespoke design tokens (palette, fonts, shadows, animations) live
// here so components stay on utility classes. The `sf-` colour family is
// the single source of truth for the storefront's brand colours.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand gold ramp
        gold: {
          50:  '#fdf9ee',
          100: '#fbf1d8',
          200: '#f4e0aa',
          300: '#e9c976',
          400: '#dcae45',
          500: '#c8952a',   // primary gold
          600: '#b8860b',   // deep gold (legacy --sf-gold)
          700: '#8a6508',   // gold-dark
          800: '#6f5208',
          900: '#5c440b',
        },
        // Warm ink (text)
        ink: {
          DEFAULT: '#2a2118',
          mid:     '#6b5d4d',
          soft:    '#9a8b78',
        },
        // Maroon / burgundy accent (Tanishq festive highlight)
        maroon: {
          50:  '#fcf2f3',
          100: '#f9e3e6',
          500: '#9e2a3c',
          600: '#7e1f30',
          700: '#5f1624',
        },
        // Surfaces
        cream:  '#fffdf9',
        ivory:  '#fdf8ef',
        sand:   '#f7f1e7',
        line:   '#ece4d8',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 1px 0 rgba(184,134,11,.04), 0 10px 30px -18px rgba(42,33,24,.35)',
        cardHov: '0 18px 40px -12px rgba(138,101,8,.22)',
        lift:    '0 12px 28px rgba(42,33,24,.12)',
        gold:    '0 6px 18px -4px rgba(184,134,11,.35)',
      },
      backgroundImage: {
        'gold-rule': 'linear-gradient(90deg,#d9b24a 0%,#b8860b 35%,#8a6508 70%,#b8860b 100%)',
        'gold-sheen': 'linear-gradient(135deg,#dcae45 0%,#b8860b 45%,#8a6508 100%)',
        'cream-fade': 'linear-gradient(180deg,#fffaf0 0%,#fffdf9 100%)',
        'hero-warm': 'radial-gradient(120% 120% at 80% 0%,#fbf1d8 0%,transparent 55%),linear-gradient(120deg,#fff8ea 0%,#fdf6ec 100%)',
      },
      letterSpacing: {
        luxe: '0.22em',
      },
      keyframes: {
        spin: { to: { transform: 'rotate(360deg)' } },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bannerSlide: {
          '0%':   { opacity: '0', transform: 'translateY(-10px) scale(.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        spin:        'spin .9s linear infinite',
        fadeUp:      'fadeUp .5s cubic-bezier(.2,.8,.2,1) both',
        fadeIn:      'fadeIn .4s ease both',
        scaleIn:     'scaleIn .25s cubic-bezier(.2,.8,.2,1) both',
        slideUp:     'slideUp .3s cubic-bezier(.2,.8,.2,1) both',
        bannerSlide: 'bannerSlide .35s cubic-bezier(.34,1.56,.64,1) both',
        shimmer:     'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')({ strategy: 'class' })],
};
