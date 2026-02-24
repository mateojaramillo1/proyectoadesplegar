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

const Usuario = mongoose.model('usuarios', UsuarioSchema);

async function crearAdmin() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const existente = await Usuario.findOne({ email: adminData.email });
    if (existente) {
      console.log('Ya existe un usuario admin con ese email.');
      return;
    }
    const hash = await bcrypt.hash(adminData.password, 10);
    adminData.password = hash;
    adminData.rol = 'admin';
    await Usuario.create(adminData);
    console.log('Usuario admin creado correctamente.');
  } catch (err) {
    console.error('Error creando admin:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

crearAdmin();
