/**
 * Service to connect directly to Google's Gemini API via REST endpoints
 */

const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Strips base64 headers if present
 */
function cleanBase64(base64Str) {
  if (!base64Str) return '';
  const commaIndex = base64Str.indexOf(',');
  if (commaIndex !== -1) {
    return base64Str.slice(commaIndex + 1);
  }
  return base64Str;
}

/**
 * Sends request to the Gemini API
 */
async function callGemini(apiKey, contents, systemInstruction = '') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `API error: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response received from Gemini.');
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON:', text);
    throw new Error('Gemini response was not valid JSON.');
  }
}

/**
 * Analyze screenshot & console/network logs to find bug reports.
 * Returns an array of Bug Report objects.
 */
export async function analyzeBrowserScan(apiKey, screenshotBase64, consoleLogs, networkRequests, targetUrl) {
  const cleanImg = cleanBase64(screenshotBase64);
  
  const systemInstruction = `You are a world-class QA Automation Engineer and Frontend Debugger. 
Your task is to analyze browser audit data (screenshots, console logs, and network failures) and identify the MOST significant software bugs.
You must output a JSON array of bug reports. Each bug report must follow this schema:
{
  "title": "Clear, concise title stating the bug (e.g. 'Failed to fetch user profiles (401 Unauthorized)')",
  "description": "Thorough explanation of what is going wrong, why it occurs, and the impact.",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "type": "Visual" | "Console" | "Network" | "Functional",
  "stepsToReproduce": ["Step 1...", "Step 2..."],
  "remediation": "Specific technical suggestions on how a developer should fix this (code changes, CSS tweaks, API modifications). Use markdown syntax inside strings if needed.",
  "visualMarkers": [
    {
      "x": number (0-100 percentage from the left where the bug is visible in the screenshot),
      "y": number (0-100 percentage from the top where the bug is visible in the screenshot),
      "width": number (0-100 width percentage of the marker box),
      "height": number (0-100 height percentage of the marker box),
      "label": "Brief label for the highlight box"
    }
  ]
}

If no obvious visual bug is highlighted, set visualMarkers to an empty array. Do not invent visual bugs. However, if there are console errors or network failures, create bugs for them even if they don't have a specific visual location.
Return a maximum of 3 distinct, high-impact bugs.`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Here is the audit data for the website: ${targetUrl}

--- CONSOLE LOGS ---
${JSON.stringify(consoleLogs, null, 2)}

--- FAILED NETWORK REQUESTS ---
${JSON.stringify(networkRequests, null, 2)}

Inspect the attached screenshot for visual anomalies (broken elements, missing images, misalignments, overlapping text) and align them with the console/network errors. Produce the list of bug reports in JSON format.`
        },
        {
          inlineData: {
            mimeType: 'image/png',
            data: cleanImg
          }
        }
      ]
    }
  ];

  return callGemini(apiKey, contents, systemInstruction);
}

/**
 * Parses and analyzes a Swagger/OpenAPI specification
 */
export async function analyzeSwaggerSpec(apiKey, specJson) {
  const systemInstruction = `You are an API Architect and Cybersecurity Reviewer. 
Your task is to analyze the provided OpenAPI/Swagger specification and detect structure discrepancies, missing security components, architectural flaws, or design issues.
You must output a JSON array of bug reports. Each bug report must follow this schema:
{
  "title": "Clear description of the API issue (e.g. 'Missing OAuth2 scopes on sensitive endpoint')",
  "description": "Details of why this is an issue, including affected paths.",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "type": "API Schema" | "Security" | "Documentation",
  "stepsToReproduce": ["Action to inspect spec...", "Verify path..."],
  "remediation": "How the API developer should modify the spec/implementation to resolve this (e.g. provide the exact YAML/JSON schema correction).",
  "affectedPaths": ["/users/{id}", "/checkout"]
}

Identify 2 to 4 key architectural or security issues in the spec.`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Please review the following Swagger/OpenAPI specification:
${JSON.stringify(specJson, null, 2)}

Find schema validation flaws, bad naming standards, security gaps (like missing auth, no rate limiting fields, CORS indicators), and write a list of bugs.`
        }
      ]
    }
  ];

  return callGemini(apiKey, contents, systemInstruction);
}
