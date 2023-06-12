import express from "express";
import { ControladorHabitaciones } from "../controllers/ControladorHabitaciones.js";
import { ControladorReservas } from "../controllers/ControladorReservas.js";

let controladorHabitacion = new ControladorHabitaciones();
let controladorReservas = new ControladorReservas()

// voy a separar y personalizar las rutas de cada servicio del api rest

export let rutas = express.Router();

rutas.get("/buscarhabitaciones",controladorHabitacion.buscandoHabitaciones);

rutas.get("/buscarhabitacion/:idhabitacion",controladorHabitacion.buscandoHabitacion);

rutas.post("/registrarhabitacion",controladorHabitacion.registrandoHabitacion);

rutas.put("/editandohabitacion/:idhabitacion",controladorHabitacion.editandoHabitacion);

rutas.get("/buscarreservas",controladorReservas.buscandoReservas);

rutas.get("/buscarreserva/:idreserva",controladorReservas.buscandoReserva);

rutas.post("/registrarreserva",controladorReservas.registrandoReservas);

rutas.put("/editandoreserva/:idreserva",controladorReservas.editandoReserva);

rutas.delete("/eliminandoreserva/:idreserva",controladorReservas.eliminandoReserva);
