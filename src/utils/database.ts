import { Client } from "../deps.ts";
import { config } from "../config.ts";

let client: Client | null = null;

export async function getDatabase(): Promise<Client> {
  if (!client) {
    client = new Client({
      hostname: config.database.hostname,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
    });
    await client.connect();
  }
  return client;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
  }
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();
  
  // Create tables if they don't exist
  await db.queryArray(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      correo VARCHAR(255) UNIQUE NOT NULL,
      contraseña VARCHAR(255) NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      rol VARCHAR(50) NOT NULL,
      activo BOOLEAN DEFAULT true,
      intentos_fallidos INT DEFAULT 0,
      bloqueado BOOLEAN DEFAULT false,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.queryArray(`
    CREATE TABLE IF NOT EXISTS profesores (
      id SERIAL PRIMARY KEY,
      usuario_id INT NOT NULL UNIQUE,
      numero_empleado VARCHAR(50) UNIQUE NOT NULL,
      departamento VARCHAR(255),
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  await db.queryArray(`
    CREATE TABLE IF NOT EXISTS alumnos (
      id SERIAL PRIMARY KEY,
      usuario_id INT NOT NULL UNIQUE,
      matricula VARCHAR(50) UNIQUE NOT NULL,
      carrera VARCHAR(255),
      semestre INT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  await db.queryArray(`
    CREATE TABLE IF NOT EXISTS materias (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      codigo VARCHAR(50) UNIQUE NOT NULL,
      profesor_id INT NOT NULL,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profesor_id) REFERENCES profesores(id)
    );
  `);

  await db.queryArray(`
    CREATE TABLE IF NOT EXISTS asistencias (
      id SERIAL PRIMARY KEY,
      alumno_id INT NOT NULL,
      materia_id INT NOT NULL,
      fecha DATE NOT NULL,
      estado VARCHAR(50) NOT NULL,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
      FOREIGN KEY (materia_id) REFERENCES materias(id),
      UNIQUE(alumno_id, materia_id, fecha)
    );
  `);

  await db.queryArray(`
    CREATE TABLE IF NOT EXISTS justificaciones (
      id SERIAL PRIMARY KEY,
      asistencia_id INT NOT NULL,
      motivo VARCHAR(500),
      estado VARCHAR(50) NOT NULL,
      profesor_id INT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asistencia_id) REFERENCES asistencias(id),
      FOREIGN KEY (profesor_id) REFERENCES profesores(id)
    );
  `);

  await db.queryArray(`
    CREATE TABLE IF NOT EXISTS logs_auditoria (
      id SERIAL PRIMARY KEY,
      usuario_id INT,
      accion VARCHAR(255) NOT NULL,
      detalles TEXT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  console.log("Database initialized successfully");
}

