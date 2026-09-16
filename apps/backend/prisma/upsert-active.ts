// Natural-key upsert helper for the soft-delete models.
//
// Several models (Faculty, Department, Program, Curriculum, CourseCategory,
// Course, Plo, Clo) deliberately have no schema-level @@unique on their
// natural key — the real constraint is a partial unique index that applies
// only WHERE isActive = true (see the comment on Faculty.code in
// schema.prisma). Prisma therefore refuses those keys in `where` on
// upsert/findUnique, so seed and import scripts must do the lookup
// themselves, scoped to the active rows the partial index covers.
export async function upsertActive<T extends { id: string }>(ops: {
  find: () => Promise<T | null>;
  update: (id: string) => Promise<T>;
  create: () => Promise<T>;
}): Promise<T> {
  const existing = await ops.find();
  return existing ? ops.update(existing.id) : ops.create();
}
