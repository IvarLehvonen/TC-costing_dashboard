import { createServer } from 'node:http';
import { route } from './router.js';

const PORT = Number(process.env.PORT) || 3000;

const server = createServer((req, res) => {
  route(req, res).catch((err) => {
    console.error('Unhandled route error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});