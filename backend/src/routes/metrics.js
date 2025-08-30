import { Router } from 'express';
let client;
try { client = await import('prom-client'); } catch { /* optional */ }

const router = Router();
if (client) {
  const register = client.register;
  client.collectDefaultMetrics();
  router.get('/', async (req,res)=>{
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
} else {
  router.get('/', (req,res)=> res.status(503).json({ message: 'Metrics not enabled' }));
}
export default router;