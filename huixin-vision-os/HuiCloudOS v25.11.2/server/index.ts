import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import videosRouter from './routes/videos.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import quotesRouter from './routes/quotes.js';
import settingsRouter from './routes/settings.js';
import { initializeDatabase } from './db/index.js';
import { ensureStorageStructure } from './services/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const webPublic = path.resolve(projectRoot, 'web', 'public');
const app = express();
const port = Number(process.env.PORT ?? 5050);

initializeDatabase();
ensureStorageStructure();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/public', express.static(webPublic, {
  setHeaders(res) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/videos', videosRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/settings', settingsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err instanceof Error ? err.message : '服务器内部错误' });
});

app.listen(port, () => {
  const localUrl = `http://localhost:${port}`;
  const networkInterfaces = Object.values(os.networkInterfaces())
    .flat()
    .filter((details): details is NonNullable<typeof details> => Boolean(details && details.address && !details.internal));
  const networkUrl = networkInterfaces.length ? `http://${networkInterfaces[0].address}:${port}` : localUrl;
  console.log('HuiCloud OS API ready');
  console.log(`Local: ${localUrl}`);
  console.log(`Network: ${networkUrl}`);
});
