
#!/usr/bin/env node

// Simple smoke test to verify that the Creatomate token is set
// This can be run manually with "node scripts/check-preview.js"
// without modifying package.json

require('dotenv').config();

const token = process.env.VITE_CREATOMATE_TOKEN;

if (!token) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: VITE_CREATOMATE_TOKEN is not set!');
  console.error('Please add your Creatomate public token to the .env file.');
  console.error('You can find this token in your Creatomate dashboard under Project Settings > API.');
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', 'Creatomate token verification passed!');
  console.log(`Token: ${token.substring(0, 5)}...${token.substring(token.length - 3)}`);
  process.exit(0);
}
