/*
 * 將 gamepad-mouse.js 的註解移除、空白壓縮，產生可獨立使用的書籤字串。
 * 掃描器會保留字串內容；來源檔避免使用 template literal，因此不需解析模板。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, '..', 'gamepad-mouse.js');
const outputPath = join(here, '..', 'standalone-bookmarklet.txt');
const source = await readFile(sourcePath, 'utf8');

function compactJavaScript(input) {
  let output = '';
  let quote = '';
  let escaped = false;
  let pendingSpace = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (lineComment) {
      if (char === '\n' || char === '\r') lineComment = false;
      else continue;
    } else if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    } else if (quote) {
      if (pendingSpace) {
        output += ' ';
        pendingSpace = false;
      }
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    } else if (char === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    } else if (char === '/' && next === '*') {
      blockComment = true;
      pendingSpace = true;
      i += 1;
      continue;
    } else if (char === '"' || char === "'") {
      if (pendingSpace) output += ' ';
      pendingSpace = false;
      quote = char;
      output += char;
      continue;
    } else if (/\s/.test(char)) {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace) {
      const previous = output[output.length - 1] || '';
      const word = /[A-Za-z0-9_$]/;
      if (word.test(previous) && word.test(char)) output += ' ';
      pendingSpace = false;
    }
    output += char;
  }
  return output.trim();
}

const compact = compactJavaScript(source);
await writeFile(outputPath, 'javascript:' + compact + '\n', 'utf8');
console.log('Wrote standalone-bookmarklet.txt (' + (compact.length + 11) + ' characters)');
