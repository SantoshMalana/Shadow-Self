const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/santo/OneDrive/Desktop/Shadow shelf/shadow-shelf';
const globalsCss = path.join(rootDir, 'app', 'globals.css');

const cssModules = [
  'app/page.module.css',
  'components/Buttons.module.css',
  'components/ChatBubble.module.css',
  'components/ChatLayout.module.css',
  'components/Forms.module.css'
];

let appendedCss = '\n/* ====== CONSOLIDATED FROM MODULES ====== */\n';

for (const mod of cssModules) {
  const fullPath = path.join(rootDir, mod);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    appendedCss += `\n/* From ${path.basename(mod)} */\n${content}\n`;
    fs.unlinkSync(fullPath); // Delete the module file
  }
}

fs.appendFileSync(globalsCss, appendedCss);
console.log('Appended CSS to globals.css and deleted .module.css files.');

// Now replace usages in all .tsx files
function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove imports
      content = content.replace(/import\s+\w+\s+from\s+['"].*\.module\.css['"];?\n?/g, '');
      
      // Replace template literal usages: ${styles.foo} -> foo
      content = content.replace(/\$\{([a-zA-Z0-9_]+Styles|styles|btnStyles|pageStyles|layoutStyles)\.([a-zA-Z0-9_]+)\}/g, '$2');
      
      // Replace standard usages: className={styles.foo} -> className="foo"
      content = content.replace(/className=\{([a-zA-Z0-9_]+Styles|styles|btnStyles|pageStyles|layoutStyles)\.([a-zA-Z0-9_]+)\}/g, 'className="$2"');
      
      // Replace complex usages: className={`${styles.foo} bar`} -> className="foo bar"
      // Since we already replaced the template literals above, this is handled natively if they were template strings.
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(rootDir, 'app'));
processDir(path.join(rootDir, 'components'));

console.log('Updated TSX files.');
