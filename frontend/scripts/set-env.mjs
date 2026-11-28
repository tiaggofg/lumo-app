import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rawUrl = process.env.BACKEND_URL || process.env.API_URL || '';
const apiUrl = rawUrl.trim().replace(/\/+$/, '');
const escapedApiUrl = apiUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const targetPath = fileURLToPath(
  new URL('../src/environments/environment.ts', import.meta.url)
);

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(
  targetPath,
  `export const environment = {\n  apiUrl: '${escapedApiUrl}',\n};\n`,
  'utf8'
);
