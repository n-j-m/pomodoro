import { defineRelations } from "drizzle-orm";
import * as schema from "#/data/schema";

export const relations = defineRelations(schema, (r) => ({
  sessionRoutines: {
    sessions: r.many.sessions({
      from: r.sessionRoutines.id,
      to: r.sessions.routineId,
    }),
  },
  sessions: {
    routine: r.one.sessionRoutines({
      from: r.sessions.routineId,
      to: r.sessionRoutines.id,
    }),
  },
}));
