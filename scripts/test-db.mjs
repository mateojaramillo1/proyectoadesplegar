import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.DATABASE;

if (!uri) {
  console.log('DB_ERR', 'Falta la variable DATABASE en .env');
  process.exit(1);
}

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 8000
  });

  const ping = await mongoose.connection.db.admin().ping();
  console.log('DB_OK', JSON.stringify(ping));
} catch (error) {
  console.log('DB_ERR', error?.name || 'Error', error?.message || String(error));
  process.exitCode = 1;
} finally {
  try {
    await mongoose.disconnect();
  } catch {
  }
}