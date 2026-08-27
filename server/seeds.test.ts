import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedDatabase } from "./seeds";
import { GreenSpace, Role, User, sequelize } from "./models";
import { greenSpaceSeeds, roleSeeds, userSeeds } from "./seedData";

describe("seedDatabase", () => {
  beforeEach(() => {
    vi.spyOn(sequelize, "sync").mockResolvedValue(sequelize);

    vi.spyOn(Role, "create")
      .mockResolvedValueOnce({ getDataValue: () => 1 } as never)
      .mockResolvedValueOnce({ getDataValue: () => 2 } as never);

    vi.spyOn(User, "create").mockResolvedValue({} as never);
    vi.spyOn(GreenSpace, "create").mockResolvedValue({} as never);
    vi.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password");
  });

  it("creates roles, users and green spaces from seed data", async () => {
    await seedDatabase();

    expect(sequelize.sync).toHaveBeenCalledWith({ force: true });
    expect(Role.create).toHaveBeenCalledTimes(roleSeeds.length);
    expect(User.create).toHaveBeenCalledTimes(userSeeds.length);
    expect(GreenSpace.create).toHaveBeenCalledTimes(greenSpaceSeeds.length);
    expect(bcrypt.hash).toHaveBeenCalledTimes(userSeeds.length);

    expect(User.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ username: "admin", role_id: 1 }),
    );
    expect(User.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ username: "regular.user", role_id: 2 }),
    );
  });
});
