import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#4f46e5', // Indigo
          secondary: '#06b6d4', // Cyan
          accent: '#8b5cf6', // Violet
          success: '#10b981', // Emerald
          warning: '#f59e0b', // Amber
          error: '#ef4444', // Red
          info: '#3b82f6', // Blue
          background: '#f8fafc',
          surface: '#ffffff',
        },
      },
      dark: {
        colors: {
          primary: '#6366f1',
          secondary: '#22d3ee',
          accent: '#a78bfa',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#f87171',
          info: '#60a5fa',
          background: '#0f172a',
          surface: '#1e293b',
        },
      },
    },
  },
});
