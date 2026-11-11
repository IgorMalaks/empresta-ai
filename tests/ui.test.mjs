import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { daySP, formatDueOn } from "../src/components/loan-dates.ts";

describe("loan date presentation", () => {
  it("should keep the civil due date instead of converting it to yesterday in Sao Paulo", () =>
    assert.equal(
      formatDueOn(new Date("2026-11-26T00:00:00.000Z")),
      "26/11/2026",
    ));
  it("should keep the previous civil date before Sao Paulo midnight", () =>
    assert.equal(daySP(new Date("2026-11-27T02:59:59.999Z")), "2026-11-26"));
  it("should change the civil date at Sao Paulo midnight", () =>
    assert.equal(daySP(new Date("2026-11-27T03:00:00.000Z")), "2026-11-27"));
});
