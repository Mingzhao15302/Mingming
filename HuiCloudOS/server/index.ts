import express from 'express';
import cors from 'cors';
import path from 'node:path';
import os from 'node:os';
import pino from 'pino';
import pinoHttp from 'pino-http';
import createError from 'http-errors';
import videosRouter from './routes/videos.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import quotesRouter from './routes/quotes.js';
import settingsRouter from './routes/settings.js';
import { prepareStorage } from './services/storage.js';
import './services/database.js';

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

prepareStorage();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

const staticRoot = path.resolve(process.cwd(), '..', 'web', 'public');
app.use('/static', express.static(staticRoot, {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  }
}));

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/videos', videosRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/settings', settingsRouter);

app.use((_req, _res, next) => {
  next(createError(404, '未找到资源'));
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? 500;
  res.status(status).json({
    error: true,
    message: err.message ?? '服务器错误'
  });
});

const port = Number.parseInt(process.env.PORT ?? '8080', 10);

app.listen(port, () => {
  const addresses = collectNetworkAddresses();
  console.log('\nHuiCloudOS 后端已启动');
  console.log(`Local:   http://localhost:${port}`);
  addresses.forEach((addr) => console.log(`Network: http://${addr}:${port}`));
});

function collectNetworkAddresses() {
  const nets = os.networkInterfaces();
  const result = new Set<string>();
  Object.values(nets).forEach((net) => {
    net?.forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        result.add(details.address);
      }
    });
  });
  if (result.size === 0) {
    result.add('127.0.0.1');
  }
  return Array.from(result);
}

export default app;
