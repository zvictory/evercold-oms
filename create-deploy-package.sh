#!/bin/bash
set -e

echo "Creating production deployment package..."

# Create temporary directory
rm -rf deploy-temp
mkdir -p deploy-temp

# Copy necessary files
echo "Copying files..."
cp -r .next deploy-temp/
cp -r public deploy-temp/
cp -r prisma deploy-temp/
cp package.json deploy-temp/
cp package-lock.json deploy-temp/
cp next.config.ts deploy-temp/
cp tsconfig.json deploy-temp/

# Create server.js if it doesn't exist
if [ ! -f server.js ]; then
cat > deploy-temp/server.js << 'SERVERJS'
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
SERVERJS
else
  cp server.js deploy-temp/
fi

# Create ZIP
echo "Creating ZIP archive..."
cd deploy-temp
zip -r ../evercold-production-ready.zip ./* > /dev/null
cd ..

# Cleanup
rm -rf deploy-temp

echo "✅ Package created: evercold-production-ready.zip"
ls -lh evercold-production-ready.zip
