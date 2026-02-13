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
    this.app.use(async (peticion, respuesta, next) => {
      try {
        await this.conectarConBD();
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
