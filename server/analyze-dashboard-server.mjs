import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const pythonScript = resolve(projectRoot, 'src/Christopher/bento_service.py');

const DEFAULT_PORT = Number(process.env.DASHBOARD_SERVER_PORT || 5001);
const DEFAULT_PYTHON = process.platform === 'win32' ? 'python' : 'python3';
const PYTHON_BIN = process.env.PYTHON_BIN || DEFAULT_PYTHON;
const ALLOWED_ORIGIN = process.env.DASHBOARD_ALLOWED_ORIGIN || '*';
const ENDPOINT = '/api/christopher/analyze-dashboard';

const baseHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    ...baseHeaders,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body, 'utf8'),
  });
  res.end(body);
}

function handleAnalyze(req, res, body) {
  let parsed;
  try {
    parsed = body ? JSON.parse(body) : {};
  } catch (error) {
    return sendJson(res, 400, { error: 'Invalid JSON body', details: String(error) });
  }

  const formId = parsed.formId || parsed.form_id;
  if (!formId || typeof formId !== 'string') {
    return sendJson(res, 400, { error: 'Missing formId in request body' });
  }

  const args = [pythonScript, '--form-id', formId, '--fragment'];
  if (parsed.noLlm === true || parsed.no_llm === true) {
    args.push('--no-llm');
  }

  const child = spawn(PYTHON_BIN, args, {
    cwd: projectRoot,
    env: process.env,
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('error', (error) => {
    console.error('[dashboard-server] Failed to start python process:', error);
    sendJson(res, 500, { error: 'Failed to invoke Python script', details: String(error) });
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error('[dashboard-server] Python script exited with code', code, '\n', stderr || stdout);
      return sendJson(res, 500, {
        error: 'Python script failed',
        exitCode: code,
        details: stderr.trim() || stdout.trim(),
      });
    }

    try {
      const result = JSON.parse(stdout);
      if (!result.success) {
        return sendJson(res, 500, { error: result.error || 'Unknown python error' });
      }
      sendJson(res, 200, {
        html: result.html,
        title: result.title,
        description: result.description,
        questionCount: result.question_count,
      });
    } catch (error) {
      console.error('[dashboard-server] Failed to parse python output:', error, '\nRaw:', stdout);
      sendJson(res, 500, { error: 'Failed to parse python output', details: String(error) });
    }
  });
}

const server = createServer((req, res) => {
  if (!req.url) {
    return sendJson(res, 404, { error: 'Not found' });
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, baseHeaders);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url.startsWith(ENDPOINT)) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => handleAnalyze(req, res, body));
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(DEFAULT_PORT, () => {
  console.log(`[dashboard-server] listening on http://localhost:${DEFAULT_PORT}${ENDPOINT}`);
  console.log(`[dashboard-server] using python executable: ${PYTHON_BIN}`);
  console.log(`[dashboard-server] script path: ${pythonScript}`);
});
