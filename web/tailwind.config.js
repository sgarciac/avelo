/** @type {import('tailwindcss').Config} */
export default {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  content: [],
  theme: {
    colors: {
      dark: '#1A1919',
      light: '#FFFFFF',
      gray: {
        darker: '#A5A5A5',
        dark: '#D5D5D5',
        DEFAULT: '#E5E5E5',
        light: '#F5F5F5',
      },
      marker: {
        DEFAULT: '#374167'
      }
    },
    fontSize: {
      xs: '0.8rem',
      sm: '0.9rem',
      base: '1.0rem',
      md: '1.1rem',
      lg: '1.5rem',
      xl: '2.0rem',
      '2xl': '3.0rem',
      '3xl': '4.0rem',
      '4xl': '6.0rem',
    },
    borderRadius: {
      none: '0',
      sm: '5px',
      md: '10px',
      lg: '20px',
      xl: '30px',
    },
    extend: {
      padding: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        xxl: '48px',
        full: '100%',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        'sm-md': '12px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        xxl: '48px',
        full: '100%',
        fit: 'fit-content',
      },
      zIndex: {
        footer: 1
      }
    }
  },
  daisyui: {
    themes: ['corporate']
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')]
}
