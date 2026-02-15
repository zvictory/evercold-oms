/**
 * Development Server with PDFKit Font Path Fix
 * Use this instead of `next dev` for local development
 */

// Monkey-patch fs to redirect /ROOT to actual project directory
const path = require('path');
const fs = require('fs');
const projectRoot = process.cwd();

// Store original functions
const originalReadFileSync = fs.readFileSync;
const originalOpenSync = fs.openSync;
const originalReadSync = fs.readSync;
const originalCloseSync = fs.closeSync;

// Redirect /ROOT paths to actual project directory
function redirectPath(filepath) {
  if (typeof filepath === 'string' && filepath.startsWith('/ROOT/')) {
    return filepath.replace('/ROOT/', projectRoot + '/');
  }
  return filepath;
}

// Patch fs.readFileSync
fs.readFileSync = function(filepath, ...args) {
  return originalReadFileSync.call(this, redirectPath(filepath), ...args);
};

// Patch fs.openSync
fs.openSync = function(filepath, ...args) {
  return originalOpenSync.call(this, redirectPath(filepath), ...args);
};

console.log('🔧 Development mode - PDFKit /ROOT path redirect enabled');
console.log('📝 /ROOT/* will redirect to:', projectRoot + '/*');

// Now start Next.js dev server
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = true;
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
