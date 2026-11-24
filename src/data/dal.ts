import { db } from "#/data/client";

export async function getSessionsWithRoutines() {
  const results = await db.query.sessions.findMany({
    with: { routine: true },
  });

  return results;
}

export async function getRoutinesWithSessions() {
  const results = await db.query.sessionRoutines.findMany({
    with: { sessions: { orderBy: { completedAt: "desc" } } },
  });

  return results;
}
