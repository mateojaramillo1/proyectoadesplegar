import express from "express";
import { ControladorHabitaciones } from "../controllers/ControladorHabitaciones.js";
import { ControladorReservas } from "../controllers/ControladorReservas.js";
import { ControladorAuth } from "../controllers/ControladorAuth.js";
import { ControladorMarketing } from "../controllers/ControladorMarketing.js";
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

rutas.put("/editandohabitacion/:idhabitacion", verificarToken, verificarAdmin, controladorHabitacion.editandoHabitacion);

rutas.get("/buscarreservas", verificarToken, verificarAdmin, controladorReservas.buscandoReservas);

rutas.get("/buscarreserva/:idreserva", verificarToken, verificarAdmin, controladorReservas.buscandoReserva);

// reservations require authentication so they are linked to the user
rutas.post("/registrarreserva", verificarToken, controladorReservas.registrandoReservas);

// authentication
rutas.post('/auth/register', controladorAuth.registrarUsuario);
rutas.post('/auth/register-admin', verificarToken, verificarAdmin, controladorAuth.registrarAdmin);
rutas.post('/auth/login', controladorAuth.login);

rutas.put("/editandoreserva/:idreserva", verificarToken, verificarAdmin, controladorReservas.editandoReserva);

rutas.delete("/eliminandoreserva/:idreserva", verificarToken, verificarAdmin, controladorReservas.eliminandoReserva);

// Cambiar estado de reserva (solo admin)
rutas.put('/cambiar-estado-reserva/:idreserva', verificarToken, verificarAdmin, controladorReservas.cambiarEstadoReserva);

// Verificar pago de reserva (solo admin)
rutas.put('/verificar-pago/:idreserva', verificarToken, verificarAdmin, controladorReservas.verificarPago);

// Obtener reservas del usuario actual
rutas.get('/mis-reservas', verificarToken, controladorReservas.misReservas);

// Verificar disponibilidad de habitación (público, pero útil antes de reservar)
rutas.post('/verificar-disponibilidad', controladorReservas.verificarDisponibilidad);

// Dashboard analitico admin
rutas.get('/admin/dashboard-reservas', verificarToken, verificarAdmin, controladorReservas.dashboardAdmin);

// Disponibilidad mensual por habitacion (admin)
rutas.get('/admin/disponibilidad-mensual', verificarToken, verificarAdmin, controladorReservas.disponibilidadMensualAdmin);

// Exportable CSV para Excel (admin)
rutas.get('/admin/exportar-reservas', verificarToken, verificarAdmin, controladorReservas.exportarReservasAdmin);

// Check-in/check-out digital (admin)
rutas.post('/admin/generar-checkin-qr/:idreserva', verificarToken, verificarAdmin, controladorReservas.generarQrCheckInAdmin);
rutas.post('/admin/procesar-checkin', verificarToken, verificarAdmin, controladorReservas.procesarCheckInAdmin);
rutas.post('/admin/procesar-checkout', verificarToken, verificarAdmin, controladorReservas.procesarCheckOutAdmin);

// CRM basico + fidelizacion (admin)
rutas.get('/admin/crm-clientes', verificarToken, verificarAdmin, controladorReservas.crmClientesAdmin);

// Marketing automatizado por segmentos CRM (admin)
rutas.get('/admin/marketing/estadisticas', verificarToken, verificarAdmin, ControladorMarketing.obtenerEstadisticas);
rutas.get('/admin/marketing/segmento/:segmento', verificarToken, verificarAdmin, ControladorMarketing.obtenerClientesSegmento);
rutas.post('/admin/marketing/enviar-campania', verificarToken, verificarAdmin, ControladorMarketing.enviarCampania);
rutas.post('/admin/marketing/vista-previa', verificarToken, verificarAdmin, ControladorMarketing.vistaPrevia);
