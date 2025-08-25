const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;
const WEB_DIR = path.join(__dirname, 'web');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Handle health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      server: 'simple-http-server',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Serve static files
  let filePath = path.join(WEB_DIR, req.url === '/' ? 'index.html' : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  
  // Default to index.html for SPA routing
  if (!path.extname(filePath)) {
    filePath = path.join(WEB_DIR, 'index.html');
  }

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        fs.readFile(path.join(WEB_DIR, 'index.html'), (error, content) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
        console.error('Server error:', error);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Simple HTTP Server Running ===`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('==============================\n');
});

// Handle server errors
server.on('error', (error) => {
  console.error('\n=== Server Error ===');
  console.error(error);
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Please free the port or use a different one.`);
  }
  console.error('====================\n');
});
