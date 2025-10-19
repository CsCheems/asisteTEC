export const config = {
  // Server configuration
  port: parseInt(Deno.env.get("PORT") || "3000"),
  host: Deno.env.get("HOST") || "0.0.0.0",
  
  // Database configuration
  database: {
    hostname: Deno.env.get("DB_HOST") || "localhost",
    port: parseInt(Deno.env.get("DB_PORT") || "5432"),
    database: Deno.env.get("DB_NAME") || "asistetec",
    user: Deno.env.get("DB_USER") || "postgres",
    password: Deno.env.get("DB_PASSWORD") || "123",
  },
  
  // JWT configuration
  jwt: {
    secret: Deno.env.get("JWT_SECRET") || "a3b8f2d1e0c9a7b6f4d3e2c1a0b9f8d7e6c5b4a3f2d1e0c9a8b7f6d5",
    expiresIn: 86400,
  },
  
  // Application configuration
  app: {
    name: "AsisteTEC",
    version: "1.0.0",
    environment: Deno.env.get("ENVIRONMENT") || "development",
  },
};

