import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { crawl } from './tools/crawl';
import { runAxe } from './tools/axe';
import { runKeyboard } from './tools/keyboard';
import { handleLLMQuery } from './llm/accessibilityAgent';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

const PORT = 3000;

app.use(bodyParser.json());

app.post('/tools/crawl', crawl);
app.post('/tools/axe', runAxe);
app.post('/tools/keyboard', runKeyboard);

app.post('/llm/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const result = await handleLLMQuery(query);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'LLM query failed',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`MCP Accessibility Server running on port ${PORT}`);
});
