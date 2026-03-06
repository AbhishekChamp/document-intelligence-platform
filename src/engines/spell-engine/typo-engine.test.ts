import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TypoEngine, cleanupTypo } from "./typo-engine";

describe("TypoEngine", () => {
  let engine: TypoEngine;

  beforeEach(() => {
    engine = new TypoEngine();
  });

  afterEach(() => {
    cleanupTypo();
  });

  it("should have correct metadata", () => {
    expect(engine.name).toBe("Typo.js Engine");
    expect(engine.version).toBe("1.3.0");
    expect(engine.enabled).toBe(true);
    expect(engine.locale).toBe("en-US");
  });

  it("should return dictionary info", () => {
    const info = engine.getDictionaryInfo();
    expect(info).toEqual({
      name: "Typo.js US English",
      version: "1.3.0",
      locale: "en-US",
      loaded: expect.any(Boolean),
      error: undefined,
    });
  });
});
