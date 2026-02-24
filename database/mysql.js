import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'yamanote.proxy.rlwy.net',
  user: 'root',
  password: 'TU_PASSWORD', // <-- pon aquí tu contraseña
  database: 'railway',
  port: 49535,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
