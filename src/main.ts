// src/main.ts

import { app } from "./app.ts"; // 1. Importa la app configurada
import { config } from "./config.ts";
import { initializeDatabase } from "./utils/database.ts";

// Initialize database and start server
try {
  await initializeDatabase();
  console.log("Database initialized successfully.");
  
  console.log(
      `🚀 ${config.app.name} server starting at http://${config.host}:${config.port}`
    );
  await app.listen({ hostname: config.host, port: config.port }); // 2. Inicia el servidor
  
} catch (error) {
  console.error("Failed to start server:", error);
  Deno.exit(1);
}
