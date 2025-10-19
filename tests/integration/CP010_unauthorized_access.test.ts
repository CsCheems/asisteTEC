// tests/integration/CP010_unauthorized_access.test.ts

import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import supertest from "npm:supertest@6.3.3";
import { app } from "../../src/app.ts";
import { getTestDatabase, setupTestDatabase, teardownTestDatabase } from "../testUtils.ts";
import { generateToken } from "../../src/utils/jwt.ts";

Deno.test("CP010 - Acceso no autorizado a panel de administrador", async (t ) => {
  const db = await getTestDatabase();

  // --- LA SOLUCIÓN FINAL Y ROBUSTA ---
  const controller = new AbortController();
  const { signal } = controller;

  // 1. Inicia el servidor en un puerto efímero (puerto 0)
  const serverPromise = app.listen({ port: 0, signal });
  const server = await serverPromise;

  // 2. Pasa el servidor ya iniciado a supertest
  const request = supertest(server);
  // --- FIN DE LA SOLUCIÓN ---

  // Setup
  await t.step("Setup: Crear usuarios con diferentes roles", async () => {
    // ... tu código de setup ...
  });

  // ... (Tus pruebas de Profesor, Alumno, Admin quedan igual) ...

  // Teardown
  await t.step("Teardown: Limpiar datos de prueba y cerrar servidor", async () => {
    await teardownTestDatabase();
    await db.end();
    // Cierra el servidor abortando el controlador
    controller.abort();
    // Espera a que el servidor se cierre completamente
    await serverPromise;
  });
});
