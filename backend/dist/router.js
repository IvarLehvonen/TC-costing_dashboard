const startTime = Date.now();
export function route(req, res) {
    const method = req.method ?? 'GET';
    const path = req.url ?? '/';
    if (method === 'GET' && path === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            uptime: Math.floor((Date.now() - startTime) / 1000),
        }));
        return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
}
//# sourceMappingURL=router.js.map