import express from "express";
import cors from 'cors'
import { rutas } from "./routes/rutas.js";
import { establecerConexion } from "./database/conexion.js";

export class API {
  constructor() {
    this.app = express();
    this.enrutarPeticiones();
  }

  async inicializar() {
    return true;
  }

  levantarServidor() {
    this.app.listen(process.env.PORT, () =>
      console.log(`encendido en ${process.env.PORT}`)
    );
  }
  enrutarPeticiones() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.get('/', (peticion, respuesta) => {
      return respuesta.status(200).json({ mensaje: 'API activa' });
    });

    this.app.get('/health', (peticion, respuesta) => {
      return respuesta.status(200).json({ status: 'ok' });
    });

    this.app.use(async (peticion, respuesta, next) => {
      if (peticion.path === '/' || peticion.path === '/health') {
        return next();
      }

      try {
        await Promise.race([
          this.conectarConBD(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar con base de datos')), 4000))
        ]);
        next();
      } catch (error) {
        return respuesta.status(500).json({
          mensaje: "Error conectando con la base de datos",
          detalle: error?.message || String(error)
        });
      }
    });
    this.app.use("/", rutas);
  }
  conectarConBD() {
    return establecerConexion();
  }
}
