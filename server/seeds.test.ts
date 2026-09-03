import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedDatabase } from "./seeds";
import {
  GreenSpace,
  ProjectOfProposal,
  ProposalOfGreenArea,
  Role,
  User,
  VoteOfProposal,
  sequelize,
} from "./models";
import {
  greenSpaceSeeds,
  projectOfProposalSeeds,
  proposalSeeds,
  roleSeeds,
  userSeeds,
  voteOfProposalSeeds,
} from "./seedData";

describe("seedDatabase", () => {
  beforeEach(() => {
    vi.spyOn(sequelize, "sync").mockResolvedValue(sequelize);

    vi.spyOn(Role, "create")
      .mockResolvedValueOnce({ getDataValue: () => 1 } as never)
      .mockResolvedValueOnce({ getDataValue: () => 2 } as never);

    vi.spyOn(User, "create").mockImplementation(
      async (payload?: Record<string, unknown>) =>
        ({
          getDataValue: (key: string) => {
            if (key === "user_id") {
              const username = String(payload?.username || "");
              return username === "admin" ? 1 : 2;
            }
            return undefined;
          },
        }) as never,
    );

    vi.spyOn(GreenSpace, "create").mockImplementation(
      async (payload?: Record<string, unknown>) =>
        ({
          getDataValue: (key: string) => {
            if (key === "space_id") {
              return String(payload?.name || "") === "Jardín Central" ? 10 : 11;
            }
            return undefined;
          },
        }) as never,
    );

    vi.spyOn(ProposalOfGreenArea, "create").mockImplementation(
      async (payload?: Record<string, unknown>) =>
        ({
          getDataValue: (key: string) => {
            if (key === "proposal_of_green_area_id") {
              return String(payload?.title || "").length;
            }
            return undefined;
          },
          update: vi.fn(async () => null),
        }) as never,
    );

    vi.spyOn(VoteOfProposal, "create").mockResolvedValue({} as never);
    vi.spyOn(ProjectOfProposal, "create").mockResolvedValue({} as never);
    vi.spyOn(bcrypt, "hash").mockImplementation(async () => "hashed-password");
  });

  it("creates full seed graph from seed data", async () => {
    await seedDatabase();

    expect(sequelize.sync).toHaveBeenCalledWith({ force: true });
    expect(Role.create).toHaveBeenCalledTimes(roleSeeds.length);
    expect(User.create).toHaveBeenCalledTimes(userSeeds.length);
    expect(GreenSpace.create).toHaveBeenCalledTimes(greenSpaceSeeds.length);
    expect(ProposalOfGreenArea.create).toHaveBeenCalledTimes(
      proposalSeeds.length,
    );
    expect(VoteOfProposal.create).toHaveBeenCalledTimes(
      voteOfProposalSeeds.length,
    );
    expect(ProjectOfProposal.create).toHaveBeenCalledTimes(
      projectOfProposalSeeds.length,
    );
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
