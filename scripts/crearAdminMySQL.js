import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Cambia estos valores por los de tu Railway
const dbConfig = {
  host: 'yamanote.proxy.rlwy.net',
  user: 'root',
  password: 'RanwraZbAzVKBYccDcqSRXLFFwUkoqXB',
  database: 'railway',
  port: 49535
};

async function crearAdmin() {
  const connection = await mysql.createConnection(dbConfig);
  const email = 'admin@admin.com';
  const password = 'admin123'; // Cambia esto después de crear el admin
  const hash = await bcrypt.hash(password, 10);

  // Verifica si ya existe
  const [rows] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (rows.length > 0) {
    console.log('El usuario admin ya existe.');
    await connection.end();
    return;
  }

  await connection.execute(
    'INSERT INTO usuarios (nombre, apellido, email, telefono, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
    ['Admin', 'Principal', email, '', hash, 'admin']
  );
  console.log('Usuario admin creado con email:', email, 'y password:', password);
  await connection.end();
}

crearAdmin();
