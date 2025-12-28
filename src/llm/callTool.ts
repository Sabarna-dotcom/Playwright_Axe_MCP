import fetch from 'node-fetch';
import { APP_CONFIG } from '../config/appConfig';

export async function callTool(toolPath: string): Promise<any> {
  const response = await fetch(`${APP_CONFIG.MCP_BASE_URL}${toolPath}`, {
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
