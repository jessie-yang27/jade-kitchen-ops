import { describe, expect, it } from "vitest";
import { colorForDish, dishIconDataUri, dishIconSvg } from "./dishIcon";

describe("colorForDish", () => {
  it("is deterministic for the same id", () => {
    expect(colorForDish("lu-rou-fan")).toBe(colorForDish("lu-rou-fan"));
  });

  it("varies across different ids (not all collapsing to one color)", () => {
    const ids = ["lu-rou-fan", "mapo-tofu", "bok-choy", "white-rice", "abc-chicken-noodle-soup"];
    const colors = new Set(ids.map(colorForDish));
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe("dishIconSvg", () => {
  it("produces a valid-looking SVG for each category", () => {
    for (const category of ["meat", "veggie", "rice", "soup"] as const) {
      const svg = dishIconSvg({ id: "x", category });
      expect(svg).toMatch(/^<svg /);
      expect(svg).toContain("</svg>");
    }
  });
});

describe("dishIconDataUri", () => {
  it("is a usable data: URI", () => {
    const uri = dishIconDataUri({ id: "lu-rou-fan", category: "meat" });
    expect(uri).toMatch(/^data:image\/svg\+xml,/);
  });

  it("is stable for the same dish", () => {
    const dish = { id: "mapo-tofu", category: "meat" as const };
    expect(dishIconDataUri(dish)).toBe(dishIconDataUri(dish));
  });
});
