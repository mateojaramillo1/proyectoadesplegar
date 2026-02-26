import express from "express";
import cors from 'cors';
import * as dotenv from 'dotenv';
import { rutas } from "./routes/rutas.js";
import { establecerConexion } from "./database/conexion.js";
dotenv.config();

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'https://angularproyect-topaz.vercel.app';
const allowedOrigins = [
  frontendOrigin,
  'http://localhost:4200',
  'http://127.0.0.1:4200'
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
// Conectar a la base de datos MongoDB Atlas
establecerConexion().catch(err => {
  console.error('No se pudo conectar a la base de datos:', err);
  process.exit(1);
});
const PORT = process.env.PORT || 3003;

// middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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