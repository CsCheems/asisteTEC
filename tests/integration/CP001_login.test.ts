// tests/integration/CP001_login.test.ts

import { assertEquals, assertExists } from "../deps.ts";
import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import supertest from "npm:supertest@6.3.3";
import { app } from "../../src/app.ts";
import { getTestDatabase, setupTestDatabase, teardownTestDatabase } from "../testUtils.ts";

Deno.test("CP001 - Login de Profesor", async (t ) => {
  const db = await getTestDatabase();

  // --- LA SOLUCIÓN FINAL Y ROBUSTA ---
  const controller = new AbortController();
  const { signal } = controller;
  const serverPromise = app.listen({ port: 0, signal });
  const server = await serverPromise;
  const request = supertest(server);
  // --- FIN DE LA SOLUCIÓN ---

  // Setup
  await t.step("Setup: Crear usuario de prueba", async () => {
    await setupTestDatabase();
    const hashedPassword = await hash("password123");
    await db.queryArray(
      `INSERT INTO usuarios (correo, contraseña, nombre, rol) VALUES ($1, $2, $3, $4)`,
      ["profesor@uteq.edu.mx", hashedPassword, "Juan Pérez", "Profesor"]
    );
  });

  // Prueba Exitosa
  await t.step("Prueba Exitosa: Login con credenciales correctas", async () => {
    const response = await request.post("/api/auth/login")
      .send({ correo: "profesor@uteq.edu.mx", contraseña: "password123" })
      .expect(200)
      .expect("Content-Type", /json/);

    assertExists(response.body.token, "La respuesta debe incluir un token");
    assertExists(response.body.usuario, "La respuesta debe incluir los datos del usuario");
    assertEquals(response.body.usuario.correo, "profesor@uteq.edu.mx");
  });

  // Teardown
  await t.step("Teardown: Limpiar datos de prueba", async () => {
    await teardownTestDatabase();
    await db.end();
    controller.abort();
    await serverPromise;
  });
});
