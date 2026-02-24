import mysql from 'mysql2/promise';

// Cambia estos valores por los de tu Railway
const dbConfig = {
  host: 'yamanote.proxy.rlwy.net',
  user: 'root',
  password: 'RanwraZbAzVKBYccDcqSRXLFFwUkoqXB', // <-- pon aquí tu contraseña
  database: 'railway',
  port: 49535
};

async function crearTablas() {
  const connection = await mysql.createConnection(dbConfig);

  // Crear tabla usuarios
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100),
      apellido VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      telefono VARCHAR(20),
      password VARCHAR(255),
      rol VARCHAR(20)
    )
  `);

  // Crear tabla habitaciones
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS habitaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100),
      descripcion TEXT,
      precio DECIMAL(10,2),
      capacidad INT,
      imagen VARCHAR(255)
    )
  `);

  // Crear tabla reservas
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT,
      habitacion_id INT,
      fechaInicio DATE,
      fechaFin DATE,
      estado VARCHAR(50),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id)
    )
  `);

  console.log('Tablas creadas correctamente.');
  await connection.end();
}

crearTablas();
