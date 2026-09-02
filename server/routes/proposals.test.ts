import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import proposalRoutes from "./proposals";
import {
  GreenSpace,
  ProjectOfProposal,
  ProjectUpdateOfProposal,
  ProposalOfGreenArea,
  User,
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
    findByPk: vi.fn(),
    create: vi.fn(),
  },
  ProjectUpdateOfProposal: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
  User: {},
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
    getDataValue: vi.fn((key: string) => values[key]),
    update: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(values, payload);
      return null;
    }),
  };
};

const makeProjectUpdateRow = () => {
  const values: Record<string, unknown> = {
    project_update_of_proposal_id: 20,
    title: "Jornada de limpieza",
    description: "Se realizo limpieza y poda inicial",
    activity_images: JSON.stringify(["/uploads/project-updates/demo.jpg"]),
    project_of_proposal_id: 9,
    user_id: 1,
    created_at: new Date("2026-01-03T00:00:00.000Z"),
    updated_at: new Date("2026-01-03T00:00:00.000Z"),
  };

  return {
    getDataValue: vi.fn((key: string) => values[key]),
    get: vi.fn((key: string) => {
      if (key !== "User") return undefined;
      return {
        getDataValue: (nestedKey: string) => {
          if (nestedKey === "user_id") return 1;
          if (nestedKey === "username") return "admin";
          if (nestedKey === "name") return "Administrador";
          return undefined;
        },
      } as User;
    }),
    update: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(values, payload);
      return null;
    }),
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

  it("returns project timeline details for a proposal", async () => {
    const proposal = makeProposalRow("approved");
    vi.mocked(ProposalOfGreenArea.findByPk).mockResolvedValue(
      proposal as never,
    );
    vi.mocked(ProjectOfProposal.findOne).mockResolvedValue(
      makeProjectRow() as never,
    );
    vi.mocked(ProjectUpdateOfProposal.findAll).mockResolvedValue(
      [makeProjectUpdateRow()] as never,
    );

    const response = await request(app)
      .get("/api/proposals/3/project")
      .set("Authorization", "Bearer any-token");

    expect(response.status).toBe(200);
    expect(response.body.project).toMatchObject({
      id: 9,
      proposalId: 3,
    });
    expect(response.body.updates).toHaveLength(1);
    expect(response.body.updates[0]).toMatchObject({
      id: 20,
      description: "Se realizo limpieza y poda inicial",
    });
  });

  it("allows admin to add a project activity update", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    vi.mocked(ProjectOfProposal.findByPk).mockResolvedValue(
      makeProjectRow() as never,
    );

    const created = makeProjectUpdateRow();
    vi.mocked(ProjectUpdateOfProposal.create).mockResolvedValue(
      created as never,
    );
    vi.mocked(ProjectUpdateOfProposal.findByPk).mockResolvedValue(
      created as never,
    );

    const response = await request(app)
      .post("/api/proposals/projects/9/updates")
      .set("Authorization", "Bearer any-token")
      .send({
        title: "Primera jornada",
        description: "Se sembro cesped y se instalara riego",
        images: ["/uploads/project-updates/demo.jpg"],
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      projectId: 9,
      userId: 1,
      title: "Jornada de limpieza",
    });
    expect(ProjectUpdateOfProposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        project_of_proposal_id: 9,
        user_id: 1,
      }),
    );
  });

  it("allows admin to update project execution status", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const project = makeProjectRow();
    vi.mocked(ProjectOfProposal.findByPk).mockResolvedValue(project as never);

    const response = await request(app)
      .patch("/api/proposals/projects/9/status")
      .set("Authorization", "Bearer any-token")
      .send({ completedStatus: "in_progress" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 9,
      completedStatus: "in_progress",
    });
    expect(project.update).toHaveBeenCalledWith(
      expect.objectContaining({ completed_status: "in_progress" }),
    );
  });
});
