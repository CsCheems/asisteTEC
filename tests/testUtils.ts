import { Client } from "../src/deps.ts";

let testDb: Client | null = null;

export async function getTestDatabase(): Promise<Client> {
  if (!testDb) {
    testDb = new Client({
      hostname: "localhost",
      port: 5432,
      database: "asistetec",
      user: "postgres",
      password: "123",
    });
    try {
      await testDb.connect();
    } catch (error) {
      console.log("Test database not available. Tests will use mock data.");
    }
  }
  return testDb;
}

export async function closeTestDatabase(): Promise<void> {
  if (testDb) {
    try {
      await testDb.end();
    } catch (error) {
      console.log("Error closing test database:", error);
    }
    testDb = null;
  }
}

export async function setupTestDatabase(): Promise<void> {
  const db = await getTestDatabase();

  try {
    // Drop existing tables
    await db.queryArray("DROP TABLE IF EXISTS logs_auditoria CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS justificaciones CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS asistencias CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS materias CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS alumnos CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS profesores CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS usuarios CASCADE");

    // Create tables
    await db.queryArray(`
      CREATE TABLE usuarios (
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
      CREATE TABLE profesores (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL UNIQUE,
        numero_empleado VARCHAR(50) UNIQUE NOT NULL,
        departamento VARCHAR(255),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
    `);

    await db.queryArray(`
      CREATE TABLE alumnos (
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
      CREATE TABLE materias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        profesor_id INT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profesor_id) REFERENCES profesores(id)
      );
    `);

    await db.queryArray(`
      CREATE TABLE asistencias (
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
      CREATE TABLE justificaciones (
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
      CREATE TABLE logs_auditoria (
        id SERIAL PRIMARY KEY,
        usuario_id INT,
        accion VARCHAR(255) NOT NULL,
        detalles TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
    `);

    console.log("Test database setup completed");
  } catch (error) {
    console.log("Could not setup test database:", error);
  }
}

export async function teardownTestDatabase(): Promise<void> {
  const db = await getTestDatabase();

  try {
    // Drop all tables
    await db.queryArray("DROP TABLE IF EXISTS logs_auditoria CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS justificaciones CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS asistencias CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS materias CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS alumnos CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS profesores CASCADE");
    await db.queryArray("DROP TABLE IF EXISTS usuarios CASCADE");

    console.log("Test database teardown completed");
  } catch (error) {
    console.log("Could not teardown test database:", error);
  }
}

export function createMockUser(overrides = {}) {
  return {
    id: 1,
    correo: "profesor@uteq.edu.mx",
    nombre: "Juan Pérez",
    rol: "Profesor",
    activo: true,
    intentos_fallidos: 0,
    bloqueado: false,
    ...overrides,
  };
}

export function createMockStudent(overrides = {}) {
  return {
    id: 1,
    usuario_id: 2,
    matricula: "2022371075",
    nombre: "Diego Antonio",
    carrera: "Ingeniería en Desarrollo y Gestión de Software",
    semestre: 5,
    ...overrides,
  };
}

export function createMockAttendance(overrides = {}) {
  return {
    id: 1,
    alumno_id: 1,
    materia_id: 1,
    fecha: "2025-10-18",
    estado: "Presente",
    ...overrides,
  };
}

