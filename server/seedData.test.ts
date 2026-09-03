import { describe, expect, it } from "vitest";
import {
  greenSpaceSeeds,
  projectOfProposalSeeds,
  proposalSeeds,
  roleSeeds,
  userSeeds,
  voteOfProposalSeeds,
} from "./seedData";

describe("seedData", () => {
  it("defines expected base roles", () => {
    expect(roleSeeds.map((role) => role.role_name)).toEqual([
      "admin",
      "regular",
    ]);
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

  it("defines proposal seeds linked to existing users and green spaces", () => {
    expect(proposalSeeds.length).toBeGreaterThan(1);

    const usernames = new Set(userSeeds.map((user) => user.username));
    const spaceNames = new Set(greenSpaceSeeds.map((space) => space.name));

    for (const proposal of proposalSeeds) {
      expect(usernames.has(proposal.username)).toBe(true);
      expect(spaceNames.has(proposal.green_space_name)).toBe(true);
      expect(proposal.title.trim().length).toBeGreaterThan(0);
      expect(proposal.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("defines vote seeds linked to proposal and user seeds", () => {
    expect(voteOfProposalSeeds.length).toBeGreaterThan(1);

    const proposalTitles = new Set(
      proposalSeeds.map((proposal) => proposal.title),
    );
    const usernames = new Set(userSeeds.map((user) => user.username));

    for (const vote of voteOfProposalSeeds) {
      expect(proposalTitles.has(vote.proposal_title)).toBe(true);
      expect(usernames.has(vote.username)).toBe(true);
      expect(Number.isNaN(new Date(vote.created_at).getTime())).toBe(false);
    }
  });

  it("defines project seeds linked to proposal and green-space seeds", () => {
    expect(projectOfProposalSeeds.length).toBeGreaterThan(1);

    const proposalTitles = new Set(
      proposalSeeds.map((proposal) => proposal.title),
    );
    const spaceNames = new Set(greenSpaceSeeds.map((space) => space.name));

    for (const project of projectOfProposalSeeds) {
      expect(proposalTitles.has(project.proposal_title)).toBe(true);
      expect(spaceNames.has(project.green_space_name)).toBe(true);
    }
  });
});
