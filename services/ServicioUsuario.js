
import { pool } from '../database/mysql.js';
// Utiliza bcrypt en el controlador para el hash

export class ServicioUsuario {
  constructor() {}


  async registrar(datosUsuario) {
    const { nombre, apellido, email, telefono, password, rol } = datosUsuario;
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, apellido, email, telefono, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido, email, telefono || '', password, rol || 'user']
    );
    return { id: result.insertId, nombre, apellido, email, telefono, rol };
  }


  async buscarPorId(id) {
    const [rows] = await pool.execute('SELECT id, nombre, apellido, email, telefono, rol FROM usuarios WHERE id = ?', [id]);
    return rows[0];
  }


  async buscarPorEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  }
}
