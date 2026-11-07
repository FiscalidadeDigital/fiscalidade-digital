/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './services/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './types/**/*.{js,ts,jsx,tsx,mdx}',
    '!./app/**/*.backup.{js,ts,jsx,tsx,mdx}',
    '!./app/**/*.encoding-backup.{js,ts,jsx,tsx,mdx}',
    '!./components/**/*.backup.{js,ts,jsx,tsx,mdx}',
    '!./components/**/*.before-company-fix.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      colors: {
        fd: {
          primary: 'var(--fd-primary)',
          'primary-hover': 'var(--fd-primary-hover)',
          accent: 'var(--fd-accent)',
          'accent-light': 'var(--fd-accent-light)',
          'accent-soft': 'var(--fd-accent-soft)',
          'sidebar-active': 'var(--fd-sidebar-active)',
          surface: 'var(--fd-surface)',
          'surface-raised': 'var(--fd-surface-raised)',
          'surface-muted': 'var(--fd-surface-muted)',
          'surface-subtle': 'var(--fd-surface-subtle)',
          border: 'var(--fd-border)',
          'border-strong': 'var(--fd-border-strong)',
          text: 'var(--fd-text-primary)',
          'text-secondary': 'var(--fd-text-secondary)',
          muted: 'var(--fd-text-muted)',
          success: 'var(--fd-success)',
          'success-soft': 'var(--fd-success-soft)',
          warning: 'var(--fd-warning)',
          'warning-soft': 'var(--fd-warning-soft)',
          danger: 'var(--fd-danger)',
          'danger-soft': 'var(--fd-danger-soft)',
          info: 'var(--fd-info)',
          'info-soft': 'var(--fd-info-soft)',
          focus: 'var(--fd-focus)',
          disabled: 'var(--fd-disabled)',
        },
      },
      borderRadius: {
        'fd-field': 'var(--fd-radius-lg)',
        'fd-card': 'var(--fd-radius-xl)',
        'fd-card-large': 'var(--fd-radius-2xl)',
      },
      fontSize: {
        'fd-eyebrow': [
          'var(--fd-font-size-eyebrow)',
          { lineHeight: '1rem', letterSpacing: '0.12em' },
        ],
        'fd-caption': ['var(--fd-font-size-caption)', { lineHeight: '1rem' }],
        'fd-body': ['var(--fd-font-size-body)', { lineHeight: 'var(--fd-line-height-body)' }],
        'fd-h3': ['var(--fd-font-size-h3)', { lineHeight: '1.3' }],
        'fd-h2': ['var(--fd-font-size-h2)', { lineHeight: 'var(--fd-line-height-tight)' }],
        'fd-h1': ['var(--fd-font-size-h1)', { lineHeight: 'var(--fd-line-height-tight)' }],
      },
      boxShadow: {
        fd: 'var(--fd-shadow)',
      },
    },
  },

  plugins: [],
};
