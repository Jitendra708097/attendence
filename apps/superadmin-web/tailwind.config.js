/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base:      '#080810',
        surface:   '#0f0f1a',
        elevated:  '#161625',
        border:    '#1e1e35',
        cyan:      '#00d4ff',
        green:     '#00ff88',
        red:       '#ff3366',
        amber:     '#ffaa00',
        purple:    '#a855f7',
        'text-primary':   '#e8e8f0',
        'text-secondary': '#6b6b8a',
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", 'monospace'],
        sans: ["'Geist'", 'system-ui', 'sans-serif'],
      },
      animation: {
        'ping-slow':    'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'count-up':     'countUp 0.8s ease-out forwards',
        'slide-in':     'slideIn 0.3s ease-out forwards',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
        'fade-in':      'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,212,255,0.1)' },
          '50%':      { boxShadow: '0 0 20px rgba(0,212,255,0.3)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(30,30,53,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,30,53,0.5) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'cyan-glow':  '0 0 20px rgba(0,212,255,0.15)',
        'green-glow': '0 0 20px rgba(0,255,136,0.15)',
        'red-glow':   '0 0 20px rgba(255,51,102,0.15)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
