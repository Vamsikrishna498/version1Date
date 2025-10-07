const fs = require('fs');
const path = require('path');

// Function to replace console.log statements in a file
function replaceConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace console.log with Logger.log
    if (content.includes('console.log')) {
      content = content.replace(/console\.log\(/g, 'Logger.log(');
      modified = true;
    }

    // Replace console.info with Logger.info
    if (content.includes('console.info')) {
      content = content.replace(/console\.info\(/g, 'Logger.info(');
      modified = true;
    }

    // Replace console.warn with Logger.warn
    if (content.includes('console.warn')) {
      content = content.replace(/console\.warn\(/g, 'Logger.warn(');
      modified = true;
    }

    // Replace console.error with Logger.error
    if (content.includes('console.error')) {
      content = content.replace(/console\.error\(/g, 'Logger.error(');
      modified = true;
    }

    // Replace console.debug with Logger.debug
    if (content.includes('console.debug')) {
      content = content.replace(/console\.debug\(/g, 'Logger.debug(');
      modified = true;
    }

    // Add Logger import if not present and we made changes
    if (modified && !content.includes("import Logger from '../utils/logger'") && !content.includes("import Logger from './utils/logger'")) {
      // Find the first import statement and add Logger import after it
      const importRegex = /import.*from.*['"];?\s*\n/;
      const match = content.match(importRegex);
      if (match) {
        const importStatement = match[0];
        const loggerImport = "import Logger from '../utils/logger';\n";
        content = content.replace(importStatement, importStatement + loggerImport);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to recursively find and process JavaScript/JSX files
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
      replaceConsoleLogs(fullPath);
    }
  }
}

// Start processing from src directory
const srcPath = path.join(__dirname, 'src');
if (fs.existsSync(srcPath)) {
  console.log('Starting console.log replacement...');
  processDirectory(srcPath);
  console.log('Console.log replacement completed!');
} else {
  console.error('src directory not found!');
}

