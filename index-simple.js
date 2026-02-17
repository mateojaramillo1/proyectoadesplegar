import express from "express";
import cors from 'cors';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3003;

// salud básica sin BD
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// endpoint raíz
app.get('/', (req, res) => {
  res.json({ mensaje: 'API activa' });
});

// para Vercel serverless
export default function handler(request, response) {
  return app(request, response);
}

// para desarrollo local
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Error en servidor:', err);
    process.exit(1);
  });
}
