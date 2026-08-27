import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  GreenSpace,
  ProjectOfProposal,
  ProposalOfGreenArea,
  VoteOfProposal,
} from "../models";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    role: string;
  };
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      user_id: number;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalido" });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }
  next();
};

const requireRegular = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || req.user.role !== "regular") {
    return res.status(403).json({ error: "Solo usuarios regulares" });
  }
  next();
};

const toIsoStringOrNull = (value: unknown) => {
  if (!value) {
    return null;
  }

  const dateValue = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }

  return dateValue.toISOString();
};

const serializeProposal = (proposal: ProposalOfGreenArea) => ({
  id: proposal.getDataValue("proposal_of_green_area_id"),
  title: proposal.getDataValue("title"),
  description: proposal.getDataValue("description"),
  status: proposal.getDataValue("status"),
  totalVotes: proposal.getDataValue("total_votes"),
  votingStarts: toIsoStringOrNull(proposal.getDataValue("voting_starts")),
  votingEnds: toIsoStringOrNull(proposal.getDataValue("voting_ends")),
  userId: proposal.getDataValue("user_id"),
  spaceId: proposal.getDataValue("space_id"),
  createdAt: toIsoStringOrNull(proposal.getDataValue("created_at")),
  updatedAt: toIsoStringOrNull(proposal.getDataValue("updated_at")),
});

const serializeProject = (project: ProjectOfProposal) => ({
  id: project.getDataValue("project_of_proposal_id"),
  title: project.getDataValue("title"),
  description: project.getDataValue("description"),
  completedStatus: project.getDataValue("completed_status"),
  proposalId: project.getDataValue("proposal_of_green_area_id"),
  spaceId: project.getDataValue("space_id"),
  createdAt: toIsoStringOrNull(project.getDataValue("created_at")),
  updatedAt: toIsoStringOrNull(project.getDataValue("updated_at")),
});

const finalizeProposalIfReady = async (proposal: ProposalOfGreenArea) => {
  const proposalId = Number(proposal.getDataValue("proposal_of_green_area_id"));
  const status = String(proposal.getDataValue("status") || "");
  const votingEndsRaw = proposal.getDataValue("voting_ends");

  if (status !== "open" || !votingEndsRaw) {
    return null;
  }

  const votingEnds = new Date(String(votingEndsRaw));
  if (Number.isNaN(votingEnds.getTime()) || new Date() < votingEnds) {
    return null;
  }

  const existingProject = await ProjectOfProposal.findOne({
    where: { proposal_of_green_area_id: proposalId },
  });

  if (existingProject) {
    await proposal.update({
      status: "approved",
      updated_at: new Date(),
    });

    return {
      proposal,
      project: existingProject,
    };
  }

  const totalVotes = await VoteOfProposal.count({
    where: { proposal_of_green_area_id: proposalId },
  });

  await proposal.update({
    total_votes: totalVotes,
    status: totalVotes > 0 ? "approved" : "closed",
    updated_at: new Date(),
  });

  if (totalVotes <= 0) {
    return {
      proposal,
      project: null,
    };
  }

  const project = await ProjectOfProposal.create({
    title: String(proposal.getDataValue("title") || ""),
    description: String(proposal.getDataValue("description") || ""),
    completed_status: "planned",
    proposal_of_green_area_id: proposalId,
    space_id: Number(proposal.getDataValue("space_id")),
    created_at: new Date(),
    updated_at: new Date(),
  });

  return {
    proposal,
    project,
  };
};

const autoFinalizeClosedVotingProposals = async () => {
  const openProposals = await ProposalOfGreenArea.findAll({
    where: { status: "open" },
  });

  for (const proposal of openProposals) {
    await finalizeProposalIfReady(proposal as ProposalOfGreenArea);
  }
};

router.get("/", authenticate, async (_req, res) => {
  await autoFinalizeClosedVotingProposals();

  const authReq = _req as AuthRequest;
  const whereClause = authReq.user?.role === "admin" ? {} : { status: "open" };

  const proposals = await ProposalOfGreenArea.findAll({
    where: whereClause,
    order: [
      ["created_at", "DESC"],
      ["proposal_of_green_area_id", "DESC"],
    ],
  });

  res.json(
    proposals.map((proposal) =>
      serializeProposal(proposal as ProposalOfGreenArea),
    ),
  );
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  const spaceId = Number(req.body?.spaceId);

  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (!title || !description) {
    return res
      .status(400)
      .json({ error: "Titulo y descripcion son obligatorios" });
  }

  if (!Number.isFinite(spaceId)) {
    return res.status(400).json({ error: "Area verde invalida" });
  }

  const greenSpace = await GreenSpace.findByPk(spaceId);
  if (!greenSpace) {
    return res.status(404).json({ error: "Area verde no encontrada" });
  }

  const proposal = await ProposalOfGreenArea.create({
    title,
    description,
    status: "draft",
    total_votes: 0,
    voting_starts: null,
    voting_ends: null,
    user_id: req.user.user_id,
    space_id: spaceId,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return res.status(201).json(serializeProposal(proposal));
});

router.post(
  "/:id/votes",
  authenticate,
  requireRegular,
  async (req: AuthRequest, res: Response) => {
    await autoFinalizeClosedVotingProposals();

    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const proposalId = Number(req.params.id);
    if (!Number.isFinite(proposalId)) {
      return res
        .status(400)
        .json({ error: "Identificador de propuesta invalido" });
    }

    const proposal = await ProposalOfGreenArea.findByPk(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: "Propuesta no encontrada" });
    }

    const status = String(proposal.getDataValue("status") || "");
    if (status !== "open") {
      return res
        .status(409)
        .json({ error: "La propuesta no esta habilitada para votacion" });
    }

    const now = new Date();
    const votingStartsRaw = proposal.getDataValue("voting_starts");
    const votingEndsRaw = proposal.getDataValue("voting_ends");
    if (!votingStartsRaw || !votingEndsRaw) {
      return res
        .status(409)
        .json({ error: "La propuesta aun no fue validada para votacion" });
    }

    const votingStarts = new Date(String(votingStartsRaw));
    const votingEnds = new Date(String(votingEndsRaw));

    if (now < votingStarts || now > votingEnds) {
      return res
        .status(409)
        .json({ error: "La ventana de votacion esta cerrada" });
    }

    const existingVote = await VoteOfProposal.findOne({
      where: {
        proposal_of_green_area_id: proposalId,
        user_id: req.user.user_id,
      },
    });

    if (existingVote) {
      return res.status(409).json({ error: "Ya votaste esta propuesta" });
    }

    await VoteOfProposal.create({
      proposal_of_green_area_id: proposalId,
      user_id: req.user.user_id,
      created_at: now,
    });

    const totalVotes = await VoteOfProposal.count({
      where: {
        proposal_of_green_area_id: proposalId,
      },
    });

    await proposal.update({
      total_votes: totalVotes,
      updated_at: new Date(),
    });

    return res.status(201).json({
      ok: true,
      proposalId,
      totalVotes,
    });
  },
);

router.patch(
  "/:id/decision",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    await autoFinalizeClosedVotingProposals();

    const proposalId = Number(req.params.id);
    if (!Number.isFinite(proposalId)) {
      return res
        .status(400)
        .json({ error: "Identificador de propuesta invalido" });
    }

    const decision = String(req.body?.decision || "")
      .trim()
      .toLowerCase();
    if (decision !== "accepted" && decision !== "rejected") {
      return res.status(400).json({ error: "Decision invalida" });
    }

    const votingStartsRaw = String(req.body?.votingStarts || "").trim();
    const votingEndsRaw = String(req.body?.votingEnds || "").trim();

    const proposal = await ProposalOfGreenArea.findByPk(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: "Propuesta no encontrada" });
    }

    const status = String(proposal.getDataValue("status") || "");
    if (status === "rejected") {
      return res.status(409).json({ error: "La propuesta ya fue rechazada" });
    }

    if (status === "open") {
      const project = await ProjectOfProposal.findOne({
        where: { proposal_of_green_area_id: proposalId },
      });
      return res.json({
        proposal: serializeProposal(proposal),
        project: project ? serializeProject(project) : null,
      });
    }

    if (decision === "rejected") {
      await proposal.update({
        status: "rejected",
        voting_starts: null,
        voting_ends: null,
        updated_at: new Date(),
      });

      return res.json({
        proposal: serializeProposal(proposal),
        project: null,
      });
    }

    const votingStarts = new Date(votingStartsRaw);
    const votingEnds = new Date(votingEndsRaw);
    if (
      Number.isNaN(votingStarts.getTime()) ||
      Number.isNaN(votingEnds.getTime()) ||
      votingStarts >= votingEnds
    ) {
      return res.status(400).json({
        error: "La ventana de votacion es invalida",
      });
    }

    await proposal.update({
      status: "open",
      voting_starts: votingStarts,
      voting_ends: votingEnds,
      updated_at: new Date(),
    });

    return res.json({
      proposal: serializeProposal(proposal),
      project: null,
    });
  },
);

router.post(
  "/:id/finalize",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const proposalId = Number(req.params.id);
    if (!Number.isFinite(proposalId)) {
      return res
        .status(400)
        .json({ error: "Identificador de propuesta invalido" });
    }

    const proposal = await ProposalOfGreenArea.findByPk(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: "Propuesta no encontrada" });
    }

    const status = String(proposal.getDataValue("status") || "");
    if (status === "rejected") {
      return res
        .status(409)
        .json({ error: "La propuesta fue rechazada por administracion" });
    }
    const finalizedResult = await finalizeProposalIfReady(proposal);
    if (!finalizedResult) {
      return res.status(409).json({ error: "La votacion aun no termina" });
    }

    return res.json({
      proposal: serializeProposal(finalizedResult.proposal),
      project: finalizedResult.project
        ? serializeProject(finalizedResult.project as ProjectOfProposal)
        : null,
    });
  },
);

export default router;
