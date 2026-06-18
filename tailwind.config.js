/** @type {import('tailwindcss').Config} */
// ── Swarnix storefront — cinematic luxe theme ────────────────────────
// All bespoke design tokens (palette, fonts, shadows, animations) live
// here so components stay on utility classes.
//
// Theme model: a CINEMATIC DARK FRAME (hero / header-on-scroll / footer
// use the `noir` ramp) wrapping WARM-IVORY EDITORIAL CONTENT (catalogue,
// cards, modals use cream/ivory/champagne) — the Cartier/VCA pattern.
// The original warm-gold tokens are kept intact so existing markup never
// breaks; new tokens (noir, stone, champagne, display font) layer on top.
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
        // Champagne — soft luminous metallic for on-dark text/accents
        champagne: {
          50:  '#faf6ee',
          100: '#f3ead7',
          200: '#e9dcc3',
          300: '#dcc9a3',
          400: '#cbb182',
          500: '#b89a63',
        },
        // Space-black / noir ramp (warm, never pure #000) — the dark frame
        noir: {
          900: '#0b0a08',
          800: '#13110d',
          700: '#1a1712',
          600: '#221d16',
          500: '#2b251c',
          400: '#3a3327',
        },
        // Warm grey ramp (greys with a brown undertone, never cold)
        stone: {
          50:  '#f6f3ee',
          100: '#ece6dc',
          200: '#d8cfc1',
          300: '#bdb2a0',
          400: '#9a8e7c',
          500: '#776c5c',
          600: '#5b5246',
        },
        // Warm ink (text)
        ink: {
          DEFAULT: '#2a2118',
          mid:     '#6b5d4d',
          soft:    '#9a8b78',
        },
        // Maroon / burgundy — demoted to a minor festive accent
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
        // Distinctive editorial display face for the hero + big moments
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 1px 0 rgba(184,134,11,.04), 0 10px 30px -18px rgba(42,33,24,.35)',
        cardHov: '0 18px 40px -12px rgba(138,101,8,.22)',
        lift:    '0 12px 28px rgba(42,33,24,.12)',
        gold:    '0 6px 18px -4px rgba(184,134,11,.35)',
        // On-dark glow for the cinematic frame
        noir:    '0 30px 80px -28px rgba(0,0,0,.7)',
        glow:    '0 0 0 1px rgba(220,201,163,.15), 0 8px 40px -8px rgba(200,149,42,.35)',
      },
      backgroundImage: {
        'gold-rule':  'linear-gradient(90deg,#d9b24a 0%,#b8860b 35%,#8a6508 70%,#b8860b 100%)',
        'gold-sheen': 'linear-gradient(135deg,#dcae45 0%,#b8860b 45%,#8a6508 100%)',
        'champ-sheen':'linear-gradient(135deg,#f3ead7 0%,#dcc9a3 45%,#b89a63 100%)',
        'cream-fade': 'linear-gradient(180deg,#fffaf0 0%,#fffdf9 100%)',
        'hero-warm':  'radial-gradient(120% 120% at 80% 0%,#fbf1d8 0%,transparent 55%),linear-gradient(120deg,#fff8ea 0%,#fdf6ec 100%)',
        // Dark cinematic surfaces
        'noir-deep':  'radial-gradient(130% 100% at 75% 0%,#221d16 0%,#0b0a08 60%)',
        'noir-fade':  'linear-gradient(180deg,#13110d 0%,#0b0a08 100%)',
        // Text-legibility scrim for the dark hero — bottom-weighted so the
        // product photo stays bright and clearly visible through the middle,
        // while the headline (anchored low) and header (its own top veil)
        // keep enough contrast.
        'hero-scrim': 'linear-gradient(180deg,rgba(11,10,8,.34) 0%,rgba(11,10,8,.06) 26%,rgba(11,10,8,.04) 46%,rgba(11,10,8,.5) 78%,rgba(11,10,8,.9) 100%)',
      },
      letterSpacing: {
        luxe:  '0.22em',
        ultra: '0.34em',
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
        // Slow Ken-Burns push for hero slides (no bounce, very gentle)
        kenburns: {
          '0%':   { transform: 'scale(1.04) translate3d(0,0,0)' },
          '100%': { transform: 'scale(1.16) translate3d(-1.5%,-2%,0)' },
        },
        // Gold sheen sweep across a surface on hover
        sheenSweep: {
          '0%':   { transform: 'translateX(-120%) skewX(-12deg)' },
          '100%': { transform: 'translateX(220%) skewX(-12deg)' },
        },
        floatSlow: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-7px)' },
        },
        scrollCue: {
          '0%':   { opacity: '0', transform: 'translateY(-3px)' },
          '40%':  { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(7px)' },
        },
      },
      animation: {
        spin:        'spin .9s linear infinite',
        fadeUp:      'fadeUp .5s cubic-bezier(.22,.61,.36,1) both',
        fadeIn:      'fadeIn .4s ease both',
        scaleIn:     'scaleIn .25s cubic-bezier(.22,.61,.36,1) both',
        slideUp:     'slideUp .3s cubic-bezier(.22,.61,.36,1) both',
        bannerSlide: 'bannerSlide .35s cubic-bezier(.34,1.56,.64,1) both',
        shimmer:     'shimmer 1.6s linear infinite',
        kenburns:    'kenburns 7s cubic-bezier(.22,.61,.36,1) both',
        sheenSweep:  'sheenSweep 1.1s cubic-bezier(.22,.61,.36,1)',
        floatSlow:   'floatSlow 5s ease-in-out infinite',
        scrollCue:   'scrollCue 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')({ strategy: 'class' })],
};
