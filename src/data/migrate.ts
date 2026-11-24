import type { PGlite } from "@electric-sql/pglite";

const migrationFiles = import.meta.glob("../../drizzle/**/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export async function runBrowserMigrations(client: PGlite) {
  await client.exec(`
    CREATE TABLE IF NOT EXISTS drizzle_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  const appliedResult = await client.query<{ name: string }>(
    `SELECT name FROM drizzle_migrations ;`,
  );
  const appliedSet = new Set(appliedResult.rows.map((r) => r.name));

  const sortedEntries = Object.entries(migrationFiles).sort(([a], [b]) => a.localeCompare(b));

  for (const [path, sqlContent] of sortedEntries) {
    const name = path.split("/").slice(-2).join("/");
    if (appliedSet.has(name)) continue;

    const statements = sqlContent
      .split(" --> statement breakpoint")
      .map((stmt) => stmt.trim())
      .filter(Boolean);

    await client.transaction(async (tx) => {
      for (const stmt of statements) {
        await tx.exec(stmt);
      }

      await tx.query(
        `INSERT INTO drizzle_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING;`,
        [name],
      );
    });
  }
}
