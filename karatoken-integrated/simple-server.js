const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const WEB_DIR = path.join(__dirname, 'web');

const SECURE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(WEB_DIR, urlPath === '/' ? 'index.html' : urlPath);
  
  // Default to index.html if the path doesn't have an extension
  if (!path.extname(filePath)) {
    filePath = path.join(WEB_DIR, 'index.html');
  }

  // Validate the path starts within WEB_DIR boundary, and is not absolute or going up
  const relative = path.relative(WEB_DIR, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(400, { 'Content-Type': 'application/json', ...SECURE_HEADERS });
    res.end(JSON.stringify({ ok: false, error: 'Invalid path' }));
    return;
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
      if(error.code === 'ENOENT') {
        // Page not found
        fs.readFile(path.join(WEB_DIR, '404.html'), (error, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html', ...SECURE_HEADERS });
          res.end(content || '404 Not Found');
        });
      } else {
        // Server error
        res.writeHead(500, { 'Content-Type': 'text/plain', ...SECURE_HEADERS });
        res.end('Server Error: ' + error.code);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType, ...SECURE_HEADERS });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
