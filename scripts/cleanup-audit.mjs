import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const DATABASE = process.env.DATABASE;
const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS || 180);

if (!DATABASE) {
  console.error('DATABASE no esta configurada.');
  process.exit(1);
}

const limite = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

try {
  await mongoose.connect(DATABASE);
  const { deletedCount } = await mongoose.connection
    .collection('auditorias')
    .deleteMany({ createdAt: { $lt: limite } });

  console.log(`Registros de auditoria eliminados: ${deletedCount}`);
  await mongoose.disconnect();
} catch (error) {
  console.error('Error limpiando auditoria:', error.message);
  process.exit(1);
}
