import { describe, expect, it } from "vitest";
import { groupScorers, splitIntoColumns, type Scorer } from "./shared";

describe("result scorer columns", () => {
  const scorers: Scorer[] = ["Kane", "Foden", "Saka", "Palmer", "Gordon"].map((player, index) => ({
    side: "home", minute: String(10 + index), player,
  }));

  it("keeps four distinct scorers in the first column", () => {
    expect(splitIntoColumns(groupScorers(scorers.slice(0, 4), "home"), 4)).toEqual([
      ["10' Kane", "11' Foden", "12' Saka", "13' Palmer"],
    ]);
  });

  it("puts the fifth scorer in the next column", () => {
    expect(splitIntoColumns(groupScorers(scorers, "home"), 4)).toEqual([
      ["10' Kane", "11' Foden", "12' Saka", "13' Palmer"], ["14' Gordon"],
    ]);
  });
});