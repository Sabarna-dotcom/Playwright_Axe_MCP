import fs from 'fs';
import path from 'path';
import { callGroqLLM } from './llmClient';
import { callTool } from './callTool';

export async function handleLLMQuery(userQuery: string): Promise<any> {
  // 1. Ask LLM to normalize intent (crawl / axe / keyboard / combinations)
  const actions = await detectActionsWithLLM(userQuery);

  if (!actions.length) {
    throw new Error('LLM could not determine any valid action');
  }

  // 2. Execute MCP tools based on intent
  const toolResults: Record<string, any> = {};

  if (actions.includes('crawl')) {
    toolResults.crawl = await callTool('/tools/crawl');
  }

  if (actions.includes('axe')) {
    toolResults.axe = await callTool('/tools/axe');
  }

  if (actions.includes('keyboard')) {
    toolResults.keyboard = await callTool('/tools/keyboard');
  }

  // 3. Ask LLM to analyze ONLY tool outputs
  const analysis = await analyzeResultsWithLLM(userQuery, toolResults);

  // 4. Prepare final result
  const finalResult = {
    query: userQuery,
    actions,
    results: toolResults,
    analysis,
    timestamp: new Date().toISOString()
  };

  // 5. Store report as JSON with timestamp
  saveReport(finalResult);

  // 6. Return same result to caller
  return finalResult;
}


async function detectActionsWithLLM(
  userQuery: string
): Promise<Array<'crawl' | 'axe' | 'keyboard'>> {

  const prompt = `
You are an intent classification system.

User request:
"${userQuery}"

Determine which accessibility actions are required.

Allowed actions:
- crawl
- axe
- keyboard

Rules:
- Multiple actions may be returned
- Order does NOT matter
- Handle spelling mistakes and synonyms
- If user says "full accessibility", include all
- Do NOT explain anything
- Return ONLY valid JSON

Example outputs:
{ "actions": ["crawl"] }
{ "actions": ["axe"] }
{ "actions": ["keyboard"] }
{ "actions": ["crawl", "axe"] }
{ "actions": ["axe", "keyboard"] }
{ "actions": ["crawl", "axe", "keyboard"] }
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
You are a senior web accessibility expert.

User request:
"${userQuery}"

The following JSON data was produced by automated accessibility tools.
You MUST analyze ONLY this data.
Do NOT assume or invent any additional issues.

=== TOOL OUTPUTS (JSON) ===
${JSON.stringify(toolResults, null, 2)}

Your tasks:
1. Identify the MOST IMPORTANT accessibility failures
2. Explain what each issue means in simple language
3. Mention which user groups are impacted (keyboard users, screen reader users, low vision users, etc.)
4. Suggest clear, actionable fixes for developers
5. Prioritize issues by severity (Critical / Serious / Moderate / Minor)
6. If no issues exist, clearly say so

Rules:
- Base conclusions strictly on tool output
- Do NOT hallucinate problems
- Be concise but clear
- Use bullet points where appropriate

Return a structured, human-readable analysis.
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
