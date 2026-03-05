import express from "express";
import cors from 'cors';
import * as dotenv from 'dotenv';
import { rutas } from "./routes/rutas.js";
import { establecerConexion } from "./database/conexion.js";
import { crearRateLimit } from './middlewares/rateLimit.js';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const app = express();
app.set('trust proxy', 1);
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

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowedOrigin =
    !origin ||
    allowedOrigins.includes(origin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

  if (origin && isAllowedOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type,Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
const PORT = process.env.PORT || 3003;

const limitadorGlobal = crearRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 180,
  message: 'Demasiadas solicitudes desde esta IP. Espere unos minutos.'
});

const limitadorAuth = crearRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 35,
  message: 'Demasiados intentos de autenticacion. Intente nuevamente.'
});

// middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '200kb' }));
app.use(limitadorGlobal);
app.use('/auth', limitadorAuth);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/health') {
    return next();
  }

  try {
    await establecerConexion();
    return next();
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
    return res.status(500).json({
      mensaje: 'No fue posible conectar con la base de datos.'
    });
  }
});

// rutas
app.get('/', (req, res) => res.json({ mensaje: 'API activa' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/', rutas);

// 404
app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada' }));

// error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ mensaje: err.message || 'Error servidor' });
});

// para Vercel serverless
export default app;

// para desarrollo local
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
}