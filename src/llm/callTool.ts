import fetch from 'node-fetch';

const MCP_BASE_URL = 'http://localhost:3000';

export async function callTool(toolPath: string): Promise<any> {
  const response = await fetch(`${MCP_BASE_URL}${toolPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tool call failed: ${errorText}`);
  }

  return await response.json();
}
