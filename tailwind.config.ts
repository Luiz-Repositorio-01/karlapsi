import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Identidade Karla Neuropsi: verde-petróleo profundo + areia quente.
        /*
         * Escala de tinta calibrada para contraste WCAG AA (>= 4,5:1) em todas
         * as superfícies claras do tema, inclusive `surface-sunken`, que é a
         * mais escura. `faint` é usado em texto auxiliar pequeno, então também
         * precisa passar em 4,5:1 — não apenas em 3:1.
         */
        ink: {
          DEFAULT: '#14211E',
          soft: '#2C3B37',
          muted: '#54625E',
          faint: '#61706C',
        },
        petrol: {
          50: '#EFF5F3',
          100: '#D8E7E3',
          200: '#B2CFC8',
          300: '#84B1A7',
          400: '#548C81',
          500: '#356E62',
          600: '#265449',
          700: '#1E433B',
          800: '#183630',
          900: '#132A25',
        },
        sand: {
          50: '#FDFBF7',
          100: '#F8F2E8',
          200: '#EFE2CE',
          300: '#E2CDAE',
          400: '#D2B187',
          500: '#C0966A',
          600: '#A87A50',
          700: '#8A6141',
          800: '#6E4E36',
          900: '#5A412F',
        },
        /*
         * Acento terracota. `500` é usado com texto branco (selos e avisos),
         * por isso a escala foi escurecida até atingir 5:1 com branco.
         */
        clay: {
          400: '#C2745B',
          500: '#A55B44',
          600: '#8E4B37',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#FBF8F3',
          sunken: '#F4EFE7',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'ui-serif', 'serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6vw, 4.5rem)', { lineHeight: '1.03', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.25rem, 4.6vw, 3.5rem)', { lineHeight: '1.06', letterSpacing: '-0.018em' }],
        'display-md': ['clamp(1.75rem, 3.4vw, 2.5rem)', { lineHeight: '1.12', letterSpacing: '-0.014em' }],
        'display-sm': ['clamp(1.375rem, 2.4vw, 1.875rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        eyebrow: ['0.75rem', { lineHeight: '1.1', letterSpacing: '0.18em' }],
      },
      spacing: {
        section: 'clamp(3.5rem, 8vw, 7rem)',
      },
      maxWidth: {
        container: '76rem',
        prose: '42rem',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 33, 30, 0.04), 0 12px 32px -18px rgba(20, 33, 30, 0.22)',
        lift: '0 2px 4px rgba(20, 33, 30, 0.05), 0 24px 48px -24px rgba(20, 33, 30, 0.28)',
        focus: '0 0 0 3px rgba(53, 110, 98, 0.28)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
