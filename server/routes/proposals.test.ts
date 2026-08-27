import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import proposalRoutes from "./proposals";
import {
  GreenSpace,
  ProjectOfProposal,
  ProposalOfGreenArea,
  VoteOfProposal,
} from "../models";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../models", () => ({
  GreenSpace: {
    findByPk: vi.fn(),
  },
  ProposalOfGreenArea: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
  VoteOfProposal: {
    findOne: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  ProjectOfProposal: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/api/proposals", proposalRoutes);

const makeProposalRow = (
  status: string = "open",
  votingStarts: Date = new Date(Date.now() - 1000 * 60),
  votingEnds: Date = new Date(Date.now() + 1000 * 60),
) => {
  const values: Record<string, unknown> = {
    proposal_of_green_area_id: 3,
    title: "Mas arboles frutales",
    description: "Plantacion en zona sur",
    status,
    total_votes: 0,
    voting_starts: votingStarts,
    voting_ends: votingEnds,
    user_id: 2,
    space_id: 10,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
  };

  return {
    getDataValue: vi.fn((key: string) => values[key]),
    update: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(values, payload);
      return null;
    }),
  };
};

const makeProjectRow = () => {
  const values: Record<string, unknown> = {
    project_of_proposal_id: 9,
    title: "Mas arboles frutales",
    description: "Plantacion en zona sur",
    completed_status: "planned",
    proposal_of_green_area_id: 3,
    space_id: 10,
    created_at: new Date("2026-01-02T00:00:00.000Z"),
    updated_at: new Date("2026-01-02T00:00:00.000Z"),
  };

  return {
    getDataValue: (key: string) => values[key],
  };
};

describe("proposal routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);
    vi.mocked(ProposalOfGreenArea.findAll).mockResolvedValue([] as never);
  });

  it("returns 401 when token is missing", async () => {
    const response = await request(app).get("/api/proposals");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Token no proporcionado" });
  });

  it("creates a proposal with valid payload", async () => {
    vi.mocked(GreenSpace.findByPk).mockResolvedValue({} as never);
    const proposal = makeProposalRow("draft");
    vi.mocked(ProposalOfGreenArea.create).mockResolvedValue(proposal as never);

    const response = await request(app)
      .post("/api/proposals")
      .set("Authorization", "Bearer any-token")
      .send({
        title: "Mas arboles frutales",
        description: "Plantacion en zona sur",
        spaceId: 10,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 3,
      title: "Mas arboles frutales",
      status: "draft",
      spaceId: 10,
    });
    expect(ProposalOfGreenArea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "draft",
        voting_starts: null,
        voting_ends: null,
      }),
    );
  });

  it("allows a regular user to vote during the voting window", async () => {
    const proposal = makeProposalRow();
    vi.mocked(ProposalOfGreenArea.findByPk).mockResolvedValue(
      proposal as never,
    );
    vi.mocked(VoteOfProposal.findOne).mockResolvedValue(null as never);
    vi.mocked(VoteOfProposal.count).mockResolvedValue(1 as never);

    const response = await request(app)
      .post("/api/proposals/3/votes")
      .set("Authorization", "Bearer any-token")
      .send({});

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ok: true,
      proposalId: 3,
      totalVotes: 1,
    });
    expect(VoteOfProposal.create).toHaveBeenCalled();
  });

  it("rejects voting when proposal is not open", async () => {
    const proposal = makeProposalRow();
    vi.mocked(proposal.getDataValue).mockImplementation((key: string) => {
      if (key === "status") return "rejected";
      return null;
    });
    vi.mocked(ProposalOfGreenArea.findByPk).mockResolvedValue(
      proposal as never,
    );

    const response = await request(app)
      .post("/api/proposals/3/votes")
      .set("Authorization", "Bearer any-token")
      .send({});

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: "La propuesta no esta habilitada para votacion",
    });
  });

  it("does not create a project immediately when admin accepts a proposal", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const proposal = makeProposalRow("draft");
    vi.mocked(ProposalOfGreenArea.findByPk).mockResolvedValue(
      proposal as never,
    );

    const response = await request(app)
      .patch("/api/proposals/3/decision")
      .set("Authorization", "Bearer any-token")
      .send({
        decision: "accepted",
        votingStarts: new Date(Date.now() + 1000).toISOString(),
        votingEnds: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.proposal.status).toBe("open");
    expect(response.body.project).toBeNull();
    expect(ProjectOfProposal.create).not.toHaveBeenCalled();
  });

  it("does not create a project when admin rejects a proposal", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const proposal = makeProposalRow("draft");
    vi.mocked(ProposalOfGreenArea.findByPk).mockResolvedValue(
      proposal as never,
    );

    const response = await request(app)
      .patch("/api/proposals/3/decision")
      .set("Authorization", "Bearer any-token")
      .send({ decision: "rejected" });

    expect(response.status).toBe(200);
    expect(response.body.proposal.status).toBe("rejected");
    expect(response.body.project).toBeNull();
    expect(ProjectOfProposal.create).not.toHaveBeenCalled();
  });

  it("requires voting window when admin accepts proposal", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const proposal = makeProposalRow("draft");
    vi.mocked(ProposalOfGreenArea.findByPk).mockResolvedValue(
      proposal as never,
    );

    const response = await request(app)
      .patch("/api/proposals/3/decision")
      .set("Authorization", "Bearer any-token")
      .send({ decision: "accepted" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "La ventana de votacion es invalida",
    });
  });

  it("creates project on finalize only when users approved by voting", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const proposal = makeProposalRow(
      "open",
      new Date(Date.now() - 1000 * 60 * 60),
      new Date(Date.now() - 1000),
    );
    vi.mocked(ProposalOfGreenArea.findByPk).mockResolvedValue(
      proposal as never,
    );
    vi.mocked(ProjectOfProposal.findOne).mockResolvedValue(null as never);
    vi.mocked(VoteOfProposal.count).mockResolvedValue(4 as never);
    vi.mocked(ProjectOfProposal.create).mockResolvedValue(
      makeProjectRow() as never,
    );

    const response = await request(app)
      .post("/api/proposals/3/finalize")
      .set("Authorization", "Bearer any-token")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.proposal.status).toBe("approved");
    expect(response.body.project).toMatchObject({
      id: 9,
      proposalId: 3,
      completedStatus: "planned",
    });
    expect(ProjectOfProposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        proposal_of_green_area_id: 3,
        space_id: 10,
      }),
    );
  });

  it("does not create project on finalize when there are no approval votes", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const proposal = makeProposalRow(
      "open",
      new Date(Date.now() - 1000 * 60 * 60),
      new Date(Date.now() - 1000),
    );
    vi.mocked(ProposalOfGreenArea.findByPk).mockResolvedValue(
      proposal as never,
    );
    vi.mocked(ProjectOfProposal.findOne).mockResolvedValue(null as never);
    vi.mocked(VoteOfProposal.count).mockResolvedValue(0 as never);

    const response = await request(app)
      .post("/api/proposals/3/finalize")
      .set("Authorization", "Bearer any-token")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.proposal.status).toBe("closed");
    expect(response.body.project).toBeNull();
    expect(ProjectOfProposal.create).not.toHaveBeenCalled();
  });
});
