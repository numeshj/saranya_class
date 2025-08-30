import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { appEvents } from '../utils/events.js';

const router = Router();

router.get('/stream', authenticate(), (req,res)=>{
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  const listener = (evt) => {
    res.write(`data: ${JSON.stringify(evt)}\n\n`);
  };
  appEvents.on('event', listener);
  req.on('close', () => appEvents.off('event', listener));
});

export default router;