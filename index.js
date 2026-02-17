import express from "express";
import cors from 'cors';
import * as dotenv from 'dotenv';
import { rutas } from "./routes/rutas.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// middleware
app.use(cors());
app.use(express.json());

// rutas
app.get('/', (req, res) => res.json({ mensaje: 'API activa' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/', rutas);

// 404
app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada' }));

// error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ mensaje: 'Error servidor' });
});

// para Vercel serverless
export default app;

// para desarrollo local
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
}