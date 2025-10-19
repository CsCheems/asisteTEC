import { assertEquals, assertExists } from "../deps.ts";
import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { getTestDatabase, setupTestDatabase, teardownTestDatabase } from "../testUtils.ts";

Deno.test("CP002 - Registro de Asistencia", async (t) => {
  const db = await getTestDatabase();

  // Setup
  await t.step("Setup: Crear datos de prueba", async () => {
    await setupTestDatabase();

    const hashedPassword = await hash("password123");

    // Crear profesor
    const profesorResult = await db.queryObject<{ id: number }>(
      `INSERT INTO usuarios (correo, contraseña, nombre, rol) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ["profesor@uteq.edu.mx", hashedPassword, "Juan Pérez", "Profesor"]
    );
    const profesorUserId = profesorResult.rows[0].id;

    await db.queryArray(
      `INSERT INTO profesores (usuario_id, numero_empleado) VALUES ($1, $2)`,
      [profesorUserId, "EMP001"]
    );

    // Crear materia
    const materiaResult = await db.queryObject<{ id: number }>(
      `INSERT INTO materias (nombre, codigo, profesor_id) 
       VALUES ($1, $2, $3) RETURNING id`,
      ["Gestión del Proceso de Software", "GPDS", profesorUserId]
    );
    const materiaId = materiaResult.rows[0].id;

    // Crear 25 alumnos
    for (let i = 1; i <= 25; i++) {
      const alumnoUserResult = await db.queryObject<{ id: number }>(
        `INSERT INTO usuarios (correo, contraseña, nombre, rol) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [`alumno${i}@uteq.edu.mx`, hashedPassword, `Alumno ${i}`, "Alumno"]
      );
      const alumnoUserId = alumnoUserResult.rows[0].id;

      await db.queryArray(
        `INSERT INTO alumnos (usuario_id, matricula, carrera, semestre) 
         VALUES ($1, $2, $3, $4)`,
        [alumnoUserId, `202237107${i}`, "IDGS", 5]
      );
    }

    console.log("Datos de prueba creados exitosamente");
  });

  // Prueba Exitosa - Registrar asistencia
  await t.step("Prueba Exitosa: Registrar asistencia de 25 alumnos", async () => {
    const materiaId = 1;
    const fecha = "2025-10-18";

    const alumnosResult = await db.queryObject<{ id: number }>(
      "SELECT id FROM alumnos LIMIT 25"
    );
    const alumnos = alumnosResult.rows;
    assertEquals(alumnos.length, 25, "Debe haber 25 alumnos");

    // Insertar asistencias
    const asistencias = alumnos.map((a, i) => ({
      alumnoId: a.id,
      estado:
        i < 22 ? "Presente" : i < 24 ? "Ausente" : "Retardo",
    }));

    for (const asistencia of asistencias) {
      await db.queryArray(
        `INSERT INTO asistencias (alumno_id, materia_id, fecha, estado) 
         VALUES ($1, $2, $3, $4)`,
        [asistencia.alumnoId, materiaId, fecha, asistencia.estado]
      );
    }

    // Verificar conteos usando Number() para BigInt
    const totalResult = await db.queryObject<{ count: bigint }>(
      "SELECT COUNT(*) as count FROM asistencias WHERE materia_id = $1 AND fecha = $2",
      [materiaId, fecha]
    );
    assertEquals(Number(totalResult.rows[0].count), 25, "Debe haber 25 registros de asistencia");

    const presentesResult = await db.queryObject<{ count: bigint }>(
      "SELECT COUNT(*) as count FROM asistencias WHERE materia_id = $1 AND fecha = $2 AND estado = 'Presente'",
      [materiaId, fecha]
    );
    const ausentesResult = await db.queryObject<{ count: bigint }>(
      "SELECT COUNT(*) as count FROM asistencias WHERE materia_id = $1 AND fecha = $2 AND estado = 'Ausente'",
      [materiaId, fecha]
    );
    const retardosResult = await db.queryObject<{ count: bigint }>(
      "SELECT COUNT(*) as count FROM asistencias WHERE materia_id = $1 AND fecha = $2 AND estado = 'Retardo'",
      [materiaId, fecha]
    );

    assertEquals(Number(presentesResult.rows[0].count), 22);
    assertEquals(Number(ausentesResult.rows[0].count), 2);
    assertEquals(Number(retardosResult.rows[0].count), 1);

    console.log("✓ Asistencias registradas correctamente: 22P, 2A, 1R");
  });

  // Teardown
  await t.step("Teardown: Limpiar datos de prueba", async () => {
    await teardownTestDatabase();
    await db.end(); // Cierra la conexión y evita TCP leaks
    console.log("Base de datos de prueba limpiada");
  });
});
