import mongoose from 'mongoose';
import { modeloHabitacion } from '../models/modeloHabitacion.js';
import dotenv from 'dotenv';
dotenv.config();

async function crearHabitacion() {
  try {
    await mongoose.connect(process.env.DATABASE, { serverSelectionTimeoutMS: 20000 });
    const habitacion = await modeloHabitacion.create({
      nombre: 'Habitación Demo',
      descripcion: 'Habitación creada por script',
      precio: 150,
      numeropersonas: 3,
      foto: ['demo.jpg']
    });
    console.log('Habitación creada:', habitacion);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error creando habitación:', err);
    process.exit(1);
  }
}

crearHabitacion();
