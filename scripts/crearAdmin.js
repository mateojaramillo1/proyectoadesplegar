import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import { modeloUsuario } from '../models/modeloUsuario.js';

const uri = process.env.DATABASE;

const adminData = {
  nombre: 'Admin',
  apellido: 'Principal',
  email: 'admin@admin.com',
  telefono: '',
  password: 'admin123',
  rol: 'admin'
};

async function crearAdmin() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const existente = await modeloUsuario.findOne({ email: adminData.email });
    if (existente) {
      console.log('Ya existe un usuario admin con ese email.');
      return;
    }
    const hash = await bcrypt.hash(adminData.password, 10);
    adminData.password = hash;
    adminData.rol = 'admin';
    await modeloUsuario.create(adminData);
    console.log('Usuario admin creado correctamente.');
  } catch (err) {
    console.error('Error creando admin:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

crearAdmin();
