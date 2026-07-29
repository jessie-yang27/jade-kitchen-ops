import { describe, expect, it } from "vitest";
import { assembleMenuDropEmail, type MenuDropCopy } from "./menuDropEmail";

const copy: MenuDropCopy = {
  headerLine: "☀️ New Boxes Are Live ☀️",
  sms: "New boxes are live! Order by Saturday for Monday pickup.",
  boxA: { label: "Mom's Classics", blurb: "Cozy, home-cooked flavors.", riceName: "Purple rice", dishNames: ["Beef with Longhorn Peppers", "Tomato & Egg Stir-Fry"] },
  boxB: { label: "Taste of Sichuan", blurb: "Bold and aromatic.", riceName: "Purple rice", dishNames: ["Twice Cooked Chicken", "Green Beans with Garlic"] },
};

describe("assembleMenuDropEmail", () => {
  it("embeds deterministic dates, not AI-generated ones", () => {
    const { subject, body } = assembleMenuDropEmail(copy, "2026-07-13");
    expect(subject).toContain("order by July 11");
    expect(body).toContain("Order By: Saturday, July 11 at 11:59 PM");
    expect(body).toContain("Pickup / Delivery On: Monday, July 13 from 4-6 PM");
  });

  it("lists both boxes with their AI-generated blurb and real dish names", () => {
    const { body } = assembleMenuDropEmail(copy, "2026-07-13");
    expect(body).toContain("Mom's Classics");
    expect(body).toContain("Cozy, home-cooked flavors.");
    expect(body).toContain("+ Beef with Longhorn Peppers");
    expect(body).toContain("Taste of Sichuan");
  });

  it("always ends with the fixed sign-off", () => {
    const { body } = assembleMenuDropEmail(copy, "2026-07-13");
    expect(body.trim()).toMatch(/With love, Jessie \+ the Jade Kitchen team$/);
  });
});
