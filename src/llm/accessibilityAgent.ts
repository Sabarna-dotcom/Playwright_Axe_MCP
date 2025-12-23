import fs from 'fs';
import path from 'path';
import { callGroqLLM } from './llmClient';
import { callTool } from './callTool';


export async function handleLLMQuery(userQuery: string): Promise<any> {
  // Ask LLM to normalize intent (crawl / axe / both)
  const actions = await detectActionsWithLLM(userQuery);

  if (!actions.length) {
    throw new Error('LLM could not determine any valid action');
  }

  // Execute MCP tools based on intent
  const toolResults: Record<string, any> = {};

  if (actions.includes('crawl')) {
    toolResults.crawl = await callTool('/tools/crawl');
  }

  if (actions.includes('axe')) {
    toolResults.axe = await callTool('/tools/axe');
  }

  // Ask LLM to analyze ONLY tool outputs
  const analysis = await analyzeResultsWithLLM(
    userQuery,
    toolResults
  );

  // Prepare final result
  const finalResult = {
    query: userQuery,
    actions,
    results: toolResults,
    analysis,
    timestamp: new Date().toISOString()
  };

  // Store report as JSON with timestamp
  saveReport(finalResult);

  // Return same result to caller
  return finalResult;
}

async function detectActionsWithLLM(
  userQuery: string
): Promise<Array<'crawl' | 'axe'>> {

  const prompt = `
You are an intent classification system.

User request:
"${userQuery}"

Determine which actions are required.

Allowed actions:
- crawl
- axe

Rules:
- If user wants both, return both
- Order does not matter
- Handle spelling mistakes and synonyms
- Do NOT explain anything
- Return ONLY valid JSON

Example outputs:
{ "actions": ["crawl"] }
{ "actions": ["axe"] }
{ "actions": ["crawl", "axe"] }
`;

  const response = await callGroqLLM(prompt);

  try {
    const parsed = JSON.parse(response);
    return parsed.actions || [];
  } catch {
    return [];
  }
}


async function analyzeResultsWithLLM(
  userQuery: string,
  toolResults: Record<string, any>
): Promise<string> {

  const prompt = `
You are an expert web accessibility auditor.

User request:
"${userQuery}"

The following data was produced by automated tools.
Analyze ONLY this data. Do NOT assume anything else.

=== TOOL OUTPUTS (JSON) ===
${JSON.stringify(toolResults, null, 2)}

Tasks:
1. Summarize overall accessibility status
2. Explain key issues in simple language
3. Mention impacted user groups
4. Suggest practical fixes
5. Do NOT invent issues

Return a clear, structured explanation.
`;

  return await callGroqLLM(prompt);
}


function saveReport(data: any) {
  const reportsDir = path.join(process.cwd(), 'src', 'reports');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const fileName = `accessibility-report-${Date.now()}.json`;
  const filePath = path.join(reportsDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
