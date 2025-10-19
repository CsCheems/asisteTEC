// Oak framework
export { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export type { Context, Middleware, RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";


// Standard library
export { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.208.0/testing/asserts.ts";

// JWT
export {
    create as createJWT,
    verify as verifyJWT,
    // También exporta los tipos Payload y Header si los necesitas
    type Payload,
    type Header,
} from "https://deno.land/x/djwt@v3.0.1/mod.ts";

// Database
export { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Utilities
export { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

