import Groq from 'groq-sdk';
import { APP_CONFIG } from '../config/appConfig';

const groqClient = new Groq({
  apiKey: APP_CONFIG.groq.apiKey
});

export async function callGroqLLM(prompt: string): Promise<string> {
  if (!APP_CONFIG.groq.apiKey) {
    throw new Error('Groq API key missing');
  }

  const completion = await groqClient.chat.completions.create({
    model: APP_CONFIG.groq.model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert web accessibility consultant.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0,
    max_tokens: 1024
  });

  return completion.choices[0]?.message?.content || '';
}
