import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './src/server/createApp';

const PORT = 3000;
const ROOT_DIR = process.cwd();

async function startServer() {
  const { app } = createApp();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vectra JEE Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
