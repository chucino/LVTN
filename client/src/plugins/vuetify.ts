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
          primary: '#2563eb',
          secondary: '#0f766e',
          accent: '#1d4ed8',
          success: '#0f766e',
          warning: '#b45309',
          error: '#b91c1c',
          info: '#55657a',
          background: '#f4f7fb',
          surface: '#ffffff',
        },
      },
    },
  },
});
