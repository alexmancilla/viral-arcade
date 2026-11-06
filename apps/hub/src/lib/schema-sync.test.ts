import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const strip = (s: string) => s.replace(/^\/\/.*$/gm, "").replace(/datasource db \{[^}]*\}/, "").trim();

describe("prisma schemas", () => {
  it("sqlite and postgres schemas declare the same models", () => {
    const sqlite = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
    const pg = readFileSync(new URL("../../prisma/schema.postgres.prisma", import.meta.url), "utf8");
    expect(strip(pg)).toBe(strip(sqlite));
  });
});
