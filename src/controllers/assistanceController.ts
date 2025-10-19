import { Context } from "../deps.ts";
import { getDatabase } from "../utils/database.ts";
import { AppState } from "../types.ts";
import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";

type GetAssistanceHistoryContext = RouterContext<
  "/assistance/history/:alumnoId",
  { alumnoId: string } & Record<string | number, string | undefined>,
  AppState
>;

export async function recordAssistance(ctx: Context) {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { materiaId, fecha, asistencias } = body;

    if (!materiaId || !fecha || !asistencias || !Array.isArray(asistencias)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Datos inválidos" };
      return;
    }

    const db = await getDatabase();
    let insertedCount = 0;

    // Insert each attendance record
    for (const asistencia of asistencias) {
      const { alumnoId, estado } = asistencia;

      if (!alumnoId || !estado) {
        continue;
      }

      try {
        await db.queryArray(
          `INSERT INTO asistencias (alumno_id, materia_id, fecha, estado) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (alumno_id, materia_id, fecha) 
           DO UPDATE SET estado = $4`,
          [alumnoId, materiaId, fecha, estado]
        );
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting attendance for student ${alumnoId}:`, error);
      }
    }

    const actorId = ctx.state.user?.id ?? null;
    const actorRol = ctx.state.user?.rol ?? "Desconocido";

    // Registrar log
    await db.queryArray(
      "INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)",
      [
        actorId,
        "REGISTRO_ASISTENCIA",
        `${actorRol} registró ${insertedCount} asistencias para la materia ${materiaId}`,
      ]
    );

    ctx.response.status = 201;
    ctx.response.body = {
      mensaje: "Asistencias registradas exitosamente",
      registrosInsertados: insertedCount,
    };
  } catch (error) {
    console.error("Record assistance error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
}

export async function getAssistanceHistory(ctx: GetAssistanceHistoryContext) {
  try {
    const alumnoId = ctx.params.alumnoId;

    if (!alumnoId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "ID de alumno requerido" };
      return;
    }

    const db = await getDatabase();

    const result = await db.queryObject<{
      id: number;
      materia_id: number;
      fecha: string;
      estado: string;
    }>(
      `SELECT a.id, a.materia_id, a.fecha, a.estado 
       FROM asistencias a
       WHERE a.alumno_id = $1
       ORDER BY a.fecha DESC`,
      [parseInt(alumnoId)]
    );

    const asistencias = result.rows;

    // Calculate statistics
    const total = asistencias.length;
    const presentes = asistencias.filter((a) => a.estado === "Presente").length;
    const ausentes = asistencias.filter((a) => a.estado === "Ausente").length;
    const retardos = asistencias.filter((a) => a.estado === "Retardo").length;
    const justificadas = asistencias.filter((a) => a.estado === "Justificada").length;

    const porcentajeAsistencia = total > 0 ? ((presentes + justificadas) / total) * 100 : 0;

    ctx.response.status = 200;
    ctx.response.body = {
      alumnoId: parseInt(alumnoId),
      asistencias,
      estadisticas: {
        total,
        presentes,
        ausentes,
        retardos,
        justificadas,
        porcentajeAsistencia: parseFloat(porcentajeAsistencia.toFixed(2)),
      },
    };
  } catch (error) {
    console.error("Get assistance history error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
}

export async function checkAbsenceThreshold(
  alumnoId: number,
  materiaId: number,
  totalSessions: number
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.queryObject<{ count: number }>(
    `SELECT COUNT(*) as count FROM asistencias 
     WHERE alumno_id = $1 AND materia_id = $2 AND estado = 'Ausente'`,
    [alumnoId, materiaId]
  );

  const absenceCount = result.rows[0]?.count || 0;
  const absencePercentage = (absenceCount / totalSessions) * 100;

  return absencePercentage >= 20;
}

