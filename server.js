// server.js
import http from 'http';
import fs from 'fs';
import path from 'path';

// Allow port configuration via command line argument or environment variable, default to 3000
const PORT = process.env.PORT || process.argv[2] || 3000;

// MIME types mapping required for ES6 modules
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.bas': 'text/plain',
    '.md': 'text/markdown'
};

http.createServer((req, res) => {
    // Serve index.html if the URL is the root
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}).listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to quit.`);
});