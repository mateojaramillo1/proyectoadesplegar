import express from "express";
import { ControladorHabitaciones } from "../controllers/ControladorHabitaciones.js";
import { ControladorReservas } from "../controllers/ControladorReservas.js";
import { ControladorAuth } from "../controllers/ControladorAuth.js";
import { verificarToken, verificarAdmin } from "../middlewares/autenticacion.js";

let controladorHabitacion = new ControladorHabitaciones();
let controladorReservas = new ControladorReservas()
let controladorAuth = new ControladorAuth();

// voy a separar y personalizar las rutas de cada servicio del api rest

export let rutas = express.Router();

rutas.get("/buscarhabitaciones",controladorHabitacion.buscandoHabitaciones);

rutas.get("/buscarhabitacion/:idhabitacion",controladorHabitacion.buscandoHabitacion);

// solo admin puede registrar habitaciones
rutas.post("/registrarhabitacion", verificarToken, verificarAdmin, controladorHabitacion.registrandoHabitacion);

rutas.put("/editandohabitacion/:idhabitacion",controladorHabitacion.editandoHabitacion);

rutas.get("/buscarreservas",controladorReservas.buscandoReservas);

rutas.get("/buscarreserva/:idreserva",controladorReservas.buscandoReserva);

// reservations require authentication so they are linked to the user
rutas.post("/registrarreserva", verificarToken, controladorReservas.registrandoReservas);

// authentication
rutas.post('/auth/register', controladorAuth.registrarUsuario);
rutas.post('/auth/register-admin', verificarToken, verificarAdmin, controladorAuth.registrarAdmin);
rutas.post('/auth/login', controladorAuth.login);

rutas.put("/editandoreserva/:idreserva",controladorReservas.editandoReserva);

rutas.delete("/eliminandoreserva/:idreserva",controladorReservas.eliminandoReserva);

// Cambiar estado de reserva (solo admin)
rutas.put('/cambiar-estado-reserva/:idreserva', verificarToken, verificarAdmin, controladorReservas.cambiarEstadoReserva);

// Verificar pago de reserva (solo admin)
rutas.put('/verificar-pago/:idreserva', verificarToken, verificarAdmin, controladorReservas.verificarPago);

// Obtener reservas del usuario actual
rutas.get('/mis-reservas', verificarToken, controladorReservas.misReservas);

// Verificar disponibilidad de habitación (público, pero útil antes de reservar)
rutas.post('/verificar-disponibilidad', controladorReservas.verificarDisponibilidad);
