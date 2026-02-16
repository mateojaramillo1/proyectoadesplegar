import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Usuario = new Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telefono: { type: String },
  password: { type: String, required: true },
  rol: { type: String, enum: ['user', 'admin'], default: 'user' }
});

export const modeloUsuario = mongoose.model('usuarios', Usuario);
