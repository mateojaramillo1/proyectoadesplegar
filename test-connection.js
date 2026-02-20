import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function probarConexion() {
  try {
    await mongoose.connect(process.env.DATABASE, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 5
    });
    console.log('✅ Conexión exitosa a MongoDB');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

probarConexion();
