/**
 * Plesk-Compatible Next.js Server Entry Point
 *
 * Plesk Node.js manager expects a standalone server.js file.
 * This creates a custom HTTP server for Next.js in production mode.
 */

// Set PDFKit font path BEFORE any modules load
const path = require('path');
if (!process.env.PDFKIT_DATA) {
  const projectRoot = process.cwd();
  process.env.PDFKIT_DATA = path.join(projectRoot, 'node_modules/pdfkit/js/data');
  process.env.NODE_PATH = path.join(projectRoot, 'node_modules');
  console.log('📝 PDFKit font path set to:', process.env.PDFKIT_DATA);
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Production mode only (Plesk environment)
const dev = false;
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting Evercold CRM Production Server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`🔌 Port: ${port}`);
console.log(`🌐 Hostname: ${hostname}`);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    console.log('✅ Next.js application prepared');

    // Create HTTP server
    createServer(async (req, res) => {
      try {
        // Parse URL
        const parsedUrl = parse(req.url, true);

        // Handle all requests through Next.js
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('❌ Error occurred handling request:', req.url);
        console.error(err);
        res.statusCode = 500;
        res.end('Internal server error');
      }
    })
      .once('error', (err) => {
        console.error('💥 Server error:', err);
        process.exit(1);
      })
      .listen(port, hostname, () => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Evercold CRM is running!');
        console.log(`🌍 Local: http://${hostname}:${port}`);
        console.log(`📊 Health check: http://${hostname}:${port}/api/health`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      });
  })
  .catch((err) => {
    console.error('💥 Failed to start server:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT signal received: closing HTTP server');
  process.exit(0);
});
