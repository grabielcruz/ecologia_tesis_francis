import { describe, expect, it } from "vitest";
import {
  greenSpaceReviewSeeds,
  greenSpaceSeeds,
  projectOfProposalSeeds,
  projectUpdateOfProposalSeeds,
  proposalSeeds,
  reportOfGreenAreaSeeds,
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

  it("defines green-space review seeds linked to existing users and spaces", () => {
    expect(greenSpaceReviewSeeds.length).toBeGreaterThan(1);

    const usernames = new Set(userSeeds.map((user) => user.username));
    const spaceNames = new Set(greenSpaceSeeds.map((space) => space.name));

    for (const review of greenSpaceReviewSeeds) {
      expect(usernames.has(review.username)).toBe(true);
      expect(spaceNames.has(review.green_space_name)).toBe(true);
      expect(review.review_notes.trim().length).toBeGreaterThan(0);
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
      expect(Number.isNaN(new Date(review.created_at).getTime())).toBe(false);
    }
  });

  it("defines report seeds linked to existing users and spaces", () => {
    expect(reportOfGreenAreaSeeds.length).toBeGreaterThan(1);

    const usernames = new Set(userSeeds.map((user) => user.username));
    const spaceNames = new Set(greenSpaceSeeds.map((space) => space.name));

    for (const report of reportOfGreenAreaSeeds) {
      expect(usernames.has(report.username)).toBe(true);
      expect(spaceNames.has(report.green_space_name)).toBe(true);
      expect(report.title.trim().length).toBeGreaterThan(0);
      expect(report.description.trim().length).toBeGreaterThan(0);
      expect(["open", "closed"]).toContain(report.state);
      expect(Number.isNaN(new Date(report.created_at).getTime())).toBe(false);
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

  it("defines project activity seeds linked to projects and users", () => {
    expect(projectUpdateOfProposalSeeds.length).toBeGreaterThan(1);

    const projectTitles = new Set(projectOfProposalSeeds.map((p) => p.title));
    const usernames = new Set(userSeeds.map((user) => user.username));

    for (const activity of projectUpdateOfProposalSeeds) {
      expect(projectTitles.has(activity.project_title)).toBe(true);
      expect(usernames.has(activity.username)).toBe(true);
      expect(activity.title.trim().length).toBeGreaterThan(0);
      expect(activity.description.trim().length).toBeGreaterThan(0);
      expect(Number.isNaN(new Date(activity.created_at).getTime())).toBe(false);
    }
  });
});
