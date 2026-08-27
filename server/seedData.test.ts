import { describe, expect, it } from "vitest";
import { greenSpaceSeeds, roleSeeds, userSeeds } from "./seedData";

describe("seedData", () => {
  it("defines expected base roles", () => {
    expect(roleSeeds.map((role) => role.role_name)).toEqual(["admin", "regular"]);
  });

  it("maps users to existing roles", () => {
    const roleNames = new Set(roleSeeds.map((role) => role.role_name));

    for (const user of userSeeds) {
      expect(roleNames.has(user.role_name)).toBe(true);
      expect(user.password.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("contains valid green-space media data", () => {
    expect(greenSpaceSeeds.length).toBeGreaterThan(0);

    for (const greenSpace of greenSpaceSeeds) {
      expect(greenSpace.images.length).toBeGreaterThan(0);
      expect(greenSpace.total_area_m2).toBeGreaterThan(0);
      expect(greenSpace.trees_count).toBeGreaterThan(0);

      for (const imageUrl of greenSpace.images) {
        expect(imageUrl.startsWith("https://")).toBe(true);
      }
    }
  });
});
