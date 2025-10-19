import { Context } from "../deps.ts";
import { getDatabase } from "../utils/database.ts";
import { AppState } from "../types.ts";
import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";

type ApproveJustificationContext = RouterContext<
  "/justifications/:id/approve", // 1. La cadena de la ruta
  { id: string } & Record<string | number, string | undefined>, // 2. El objeto de parámetros
  AppState // 3. Tu estado de aplicación personalizado
>;

type GetPendingJustificationsContext = Context<AppState>;


export async function approveJustification(ctx: ApproveJustificationContext) {
  try {
    const justificationId = ctx.params.id;

    if (!justificationId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "ID de justificación requerido" };
      return;
    }

    const db = await getDatabase();

    // Get justification and related attendance
    const justResult = await db.queryObject<{
      id: number;
      asistencia_id: number;
      estado: string;
    }>(
      "SELECT id, asistencia_id, estado FROM justificaciones WHERE id = $1",
      [parseInt(justificationId)]
    );

    if (justResult.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Justificación no encontrada" };
      return;
    }

    const justification = justResult.rows[0];

    if (justification.estado === "Aprobada") {
      ctx.response.status = 400;
      ctx.response.body = { error: "La justificación ya ha sido aprobada" };
      return;
    }

    // Update justification status
    await db.queryArray(
      "UPDATE justificaciones SET estado = 'Aprobada', profesor_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2",
      [ctx.state.user?.id || null, parseInt(justificationId)]
    );

    // Update attendance status to 'Justificada'
    await db.queryArray(
      "UPDATE asistencias SET estado = 'Justificada' WHERE id = $1",
      [justification.asistencia_id]
    );

    // Log the action
    await db.queryArray(
      "INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)",
      [
        ctx.state.user?.id || null,
        "APROBAR_JUSTIFICACION",
        `Justificación ${justificationId} aprobada`,
      ]
    );

    ctx.response.status = 200;
    ctx.response.body = {
      mensaje: "Justificación aprobada exitosamente",
      justificacionId: parseInt(justificationId),
    };
  } catch (error) {
    console.error("Approve justification error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
}

export async function getPendingJustifications(ctx: GetPendingJustificationsContext) {
  try {
    const db = await getDatabase();

    const result = await db.queryObject<{
      id: number;
      asistencia_id: number;
      motivo: string;
      estado: string;
      alumno_id: number;
      fecha: string;
    }>(
      `SELECT j.id, j.asistencia_id, j.motivo, j.estado, a.alumno_id, a.fecha
       FROM justificaciones j
       JOIN asistencias a ON j.asistencia_id = a.id
       WHERE j.estado = 'Pendiente'
       ORDER BY j.fecha_creacion ASC`
    );

    ctx.response.status = 200;
    ctx.response.body = {
      justificaciones: result.rows,
      total: result.rows.length,
    };
  } catch (error) {
    console.error("Get pending justifications error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
}

