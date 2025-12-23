export const APP_CONFIG = {
  TARGET_URL: 'https://example.com',

  BASIC_AUTH: {
    enabled: false,        // set false if no auth
    username: 'your-username',
    password: 'your-password'
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'llama-3.1-8b-instant'
  },
  reportsDir: 'src/reports',
};
