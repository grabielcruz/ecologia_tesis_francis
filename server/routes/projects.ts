import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  ProjectOfProposal,
  ProjectUpdateOfProposal,
  ProposalOfGreenArea,
  User,
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

const serializeLatestUpdate = (update: ProjectUpdateOfProposal) => {
  const creator = update.get("User") as User | undefined;

  return {
    id: update.getDataValue("project_update_of_proposal_id"),
    title: String(update.getDataValue("title") || ""),
    description: String(update.getDataValue("description") || ""),
    createdBy: creator
      ? {
          id: creator.getDataValue("user_id"),
          username: String(creator.getDataValue("username") || ""),
          name: String(creator.getDataValue("name") || ""),
        }
      : null,
    createdAt: toIsoStringOrNull(update.getDataValue("created_at")),
  };
};

router.get("/", authenticate, async (_req: AuthRequest, res: Response) => {
  const projects = await ProjectOfProposal.findAll({
    order: [
      ["updated_at", "DESC"],
      ["project_of_proposal_id", "DESC"],
    ],
  });

  const rows = await Promise.all(
    projects.map(async (project) => {
      const proposalId = Number(project.getDataValue("proposal_of_green_area_id"));
      if (!Number.isFinite(proposalId)) {
        return null;
      }

      const proposal = await ProposalOfGreenArea.findByPk(proposalId);
      if (!proposal) {
        return null;
      }

      const latestUpdate = await ProjectUpdateOfProposal.findOne({
        where: {
          project_of_proposal_id: Number(
            project.getDataValue("project_of_proposal_id"),
          ),
        },
        include: [{ model: User, attributes: ["user_id", "username", "name"] }],
        order: [
          ["created_at", "DESC"],
          ["project_update_of_proposal_id", "DESC"],
        ],
      });

      return {
        proposal: serializeProposal(proposal as ProposalOfGreenArea),
        project: serializeProject(project as ProjectOfProposal),
        latestUpdate: latestUpdate
          ? serializeLatestUpdate(latestUpdate as ProjectUpdateOfProposal)
          : null,
      };
    }),
  );

  return res.json(rows.filter((row): row is NonNullable<typeof row> => row !== null));
});

export default router;
