/**
 * Case-insensitive substring search (Prisma's `contains` + `mode: "insensitive"`)
 * compiles to Postgres ILIKE, where `%` and `_` are wildcards. Prisma
 * parameterizes the value, so this is not a SQL-injection risk, but a search
 * term that itself contains `%` or `_` is still interpreted as a wildcard by
 * ILIKE rather than matched literally — searching "50%" would match any text
 * with "50" followed by anything, not just patients whose name has a literal
 * "%". Escaping those two characters (and the escape character itself) before
 * the term reaches `contains` makes the search literal, matching what a user
 * typing "%" or "_" expects.
 */
export function escapeLikeWildcards(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * A filter that requires every word of a search to match at least one field,
 * so "John Davis" finds a patient named John Davis. Matching the whole phrase
 * against each field found nothing, because no single field holds both names.
 * Each word is escaped like any other search term.
 */
export function wordsMatchAnyField(query: string, fields: readonly string[]) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  return {
    AND: words.map((word) => ({
      OR: fields.map((field) => ({
        [field]: {
          contains: escapeLikeWildcards(word),
          mode: "insensitive" as const,
        },
      })),
    })),
  };
}
