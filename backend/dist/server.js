import { createServer } from 'node:http';
import { route } from './router.js';
const PORT = Number(process.env.PORT) || 3000;
const server = createServer((req, res) => {
    route(req, res);
});
server.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});
//# sourceMappingURL=server.js.map