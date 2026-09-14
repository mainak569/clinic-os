/**
 * Unit Tests: search filters
 *
 * Regression for full-name search: "John Davis" matched nothing, because the
 * whole phrase was compared with each field and no single field holds both
 * names.
 */

import { describe, it, expect } from "@jest/globals";
import { escapeLikeWildcards, wordsMatchAnyField } from "@/lib/db-search";

const FIELDS = ["firstName", "lastName", "email"];

describe("wordsMatchAnyField", () => {
  it("keeps a single word matching any field", () => {
    expect(wordsMatchAnyField("davis", FIELDS)).toEqual({
      AND: [
        {
          OR: [
            { firstName: { contains: "davis", mode: "insensitive" } },
            { lastName: { contains: "davis", mode: "insensitive" } },
            { email: { contains: "davis", mode: "insensitive" } },
          ],
        },
      ],
    });
  });

  it("requires every word of a full name to match", () => {
    const filter = wordsMatchAnyField("John Davis", FIELDS);
    expect(filter.AND).toHaveLength(2);
    expect(filter.AND[0].OR[0]).toEqual({
      firstName: { contains: "John", mode: "insensitive" },
    });
    expect(filter.AND[1].OR[1]).toEqual({
      lastName: { contains: "Davis", mode: "insensitive" },
    });
  });

  it("ignores extra spaces", () => {
    expect(wordsMatchAnyField("  John   Davis ", FIELDS).AND).toHaveLength(2);
  });

  it("escapes wildcards in each word", () => {
    const filter = wordsMatchAnyField("50% off_", FIELDS);
    expect(filter.AND[0].OR[0]).toEqual({
      firstName: { contains: "50\\%", mode: "insensitive" },
    });
    expect(filter.AND[1].OR[0]).toEqual({
      firstName: { contains: "off\\_", mode: "insensitive" },
    });
    expect(escapeLikeWildcards("a_b%c")).toBe("a\\_b\\%c");
  });
});
