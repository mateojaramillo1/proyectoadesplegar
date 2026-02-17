import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { modeloUsuario } from './models/modeloUsuario.js';

const uri = 'mongodb+srv://teojaramillosuarez_db_user:zsiX2d1qY9Zbi5XM@cluster0.to4a5wv.mongodb.net/hotel?retryWrites=true&w=majority&appName=Cluster0';

async function crearAdmin() {
  await mongoose.connect(uri);
  const hash = await bcrypt.hash('Admin1234', 10);
  const existe = await modeloUsuario.findOne({ email: 'admin@hotel.com' });
  if (existe) {
    console.log('El usuario admin ya existe');
  } else {
    await modeloUsuario.create({
      nombre: 'Admin',
      apellido: 'Principal',
      email: 'admin@hotel.com',
      telefono: '0000000000',
      password: hash,
      rol: 'admin'
    });
    console.log('Usuario admin creado');
  }
  await mongoose.disconnect();
}

crearAdmin();
