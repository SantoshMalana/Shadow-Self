const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/santo/OneDrive/Desktop/Shadow shelf/shadow-shelf';

const replacements = [
  { search: /#8328f9/g, replace: 'var(--color-accent)' },
  { search: /#4c1594/g, replace: 'var(--color-accent-deep)' },
  { search: /#2b2145/g, replace: 'var(--color-border)' },
  { search: /#140f20/g, replace: 'var(--color-card)' },
  // Keeping #ffffff and #c084fc in radial-gradient as is, since gradients in JS style attributes don't always parse well with multiple nested var() in React if we're not careful, but wait, var() is standard CSS and works fine in inline styles! Let's just do it.
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const r of replacements) {
        if (content.match(r.search)) {
          content = content.replace(r.search, r.replace);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir(path.join(rootDir, 'app'));
processDir(path.join(rootDir, 'components'));

console.log('Finished replacing hardcoded colors.');
