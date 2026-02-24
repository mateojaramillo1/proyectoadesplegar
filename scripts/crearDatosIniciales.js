import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const uri = process.env.DATABASE;

const adminData = {
  nombre: 'Admin',
  apellido: 'Hotel',
  email: 'admin@hotel.com',
  telefono: '1234567890',
  password: 'Admin1234',
  rol: 'admin'
};

const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  email: { type: String, unique: true },
  telefono: String,
  password: String,
  rol: String
});

const HabitacionSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  precio: Number,
  capacidad: Number,
  imagen: String
});

const ReservaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' },
  habitacion: { type: mongoose.Schema.Types.ObjectId, ref: 'habitaciones' },
  fechaInicio: Date,
  fechaFin: Date,
  estado: String
});

const Usuario = mongoose.model('usuarios', UsuarioSchema);
const Habitacion = mongoose.model('habitaciones', HabitacionSchema);
const Reserva = mongoose.model('reservas', ReservaSchema);

async function crearDatosIniciales() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
    // Usuario admin
    const existente = await Usuario.findOne({ email: adminData.email });
    if (!existente) {
      const hash = await bcrypt.hash(adminData.password, 10);
      adminData.password = hash;
      await Usuario.create(adminData);
      console.log('Usuario admin creado correctamente.');
    } else {
      console.log('El usuario admin ya existe.');
    }
    // Habitaciones de ejemplo
    const habitaciones = [
      { nombre: 'Suite Deluxe', descripcion: 'Habitación de lujo', precio: 200, capacidad: 2, imagen: '' },
      { nombre: 'Habitación Doble', descripcion: 'Para dos personas', precio: 120, capacidad: 2, imagen: '' },
      { nombre: 'Habitación Individual', descripcion: 'Para una persona', precio: 80, capacidad: 1, imagen: '' }
    ];
    for (const hab of habitaciones) {
      const existe = await Habitacion.findOne({ nombre: hab.nombre });
      if (!existe) {
        await Habitacion.create(hab);
        console.log(`Habitación creada: ${hab.nombre}`);
      }
    }
    // No se crean reservas por defecto
  } catch (err) {
    console.error('Error creando datos iniciales:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

crearDatosIniciales();
