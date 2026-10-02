// Guard this deployment-only patch against upstream file changes.
const fs = require('node:fs');
const crypto = require('node:crypto');
const files = [
  ['/app/apps/backend/dist/libraries/nestjs-libraries/src/integrations/social/youtube.provider.js', '525cca80f6e98b1ab6737e40fb4cd196d42ca8bf6fad0ee513e56ad18041aa36'],
  ['/app/apps/orchestrator/dist/libraries/nestjs-libraries/src/integrations/social/youtube.provider.js', '525cca80f6e98b1ab6737e40fb4cd196d42ca8bf6fad0ee513e56ad18041aa36'],
  ['/app/libraries/nestjs-libraries/src/integrations/social/youtube.provider.ts', '7bb888e7cbf0f79da5cf4ce266fd654d5ded568a65be5b53248862fc291af9a0'],
];
const removed = ['youtube', 'youtube.force-ssl', 'youtubepartner'];
const replacements = files.map(([path, expected]) => {
  const original = fs.readFileSync(path, 'utf8');
  if (crypto.createHash('sha256').update(original).digest('hex') !== expected) {
    throw new Error(`Unexpected upstream provider: ${path}`);
  }
  let updated = original;
  for (const scope of removed) {
    const line = new RegExp(`^[ \\t]*'https://www\\.googleapis\\.com/auth/${scope.replaceAll('.', '\\.')}',[ \\t]*\\r?\\n`, 'gm');
    if ([...updated.matchAll(line)].length !== 1) throw new Error(`Expected one scope declaration: ${scope}`);
    updated = updated.replace(line, '');
  }
  return [path, updated];
});
for (const [path, updated] of replacements) fs.writeFileSync(path, updated);
console.log('Narrowed YouTube scope declarations in backend, orchestrator and source.');
