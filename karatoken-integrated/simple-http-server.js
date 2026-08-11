const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;
const WEB_DIR = path.join(__dirname, 'web');

// Standard HTTP security headers to mitigate common web vulnerabilities
const SECURE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Handle health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      ...SECURE_HEADERS
    });
    res.end(JSON.stringify({
      status: 'ok',
      server: 'simple-http-server',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Serve static files
  // Strip query parameters to prevent query-based file access / cache poisoning
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(WEB_DIR, urlPath === '/' ? 'index.html' : urlPath);
  
  // Default to index.html for SPA routing
  if (!path.extname(filePath)) {
    filePath = path.join(WEB_DIR, 'index.html');
  }

  // Security: Check for path traversal. Validate that resolved filePath resides strictly
  // within the WEB_DIR boundary, and is not absolute or going up.
  const relative = path.relative(WEB_DIR, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(400, {
      'Content-Type': 'application/json',
      ...SECURE_HEADERS
    });
    res.end(JSON.stringify({ ok: false, error: 'Invalid path' }));
    return;
  }

  // Security: Ensure the file actually exists and is a regular file (not a directory)
  // to prevent directory scanning, arbitrary traversal, or denial of service.
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
        ...SECURE_HEADERS
      });
      res.end(JSON.stringify({ ok: false, error: 'Not a file' }));
      return;
    }
  } catch (err) {
    // If file doesn't exist, handle it downstream in fs.readFile
  }

  const extname = String(path.extname(filePath)).toLowerCase();

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
        // File not found - Fallback to index.html with secure headers
        fs.readFile(path.join(WEB_DIR, 'index.html'), (error, content) => {
          res.writeHead(200, {
            'Content-Type': 'text/html',
            ...SECURE_HEADERS
          });
          res.end(content, 'utf-8');
        });
      } else {
        // Server error with secure headers
        res.writeHead(500, {
          'Content-Type': 'text/plain',
          ...SECURE_HEADERS
        });
        res.end('Server Error: ' + error.code);
        console.error('Server error:', error);
      }
    } else {
      // Success with secure headers
      res.writeHead(200, {
        'Content-Type': contentType,
        ...SECURE_HEADERS
      });
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
