import mongoose from 'mongoose';

const uri = 'mongodb+srv://teojaramillosuarez_db_user:zsiX2d1qY9Zbi5XM@cluster0.to4a5wv.mongodb.net/hotel?retryWrites=true&w=majority&appName=Cluster0';

async function testConexion() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Conexión exitosa a MongoDB Atlas');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testConexion();
