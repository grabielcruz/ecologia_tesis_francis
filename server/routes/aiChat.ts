import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  GreenSpace,
  ProjectOfProposal,
  ProposalOfGreenArea,
  ReportOfGreenArea,
  TreeInventory,
  TreeType,
  User,
} from "../models";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash-lite";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 45000);
const GEMINI_MAX_OUTPUT_TOKENS = Number(
  process.env.GEMINI_MAX_OUTPUT_TOKENS || 900,
);

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    role: string;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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

const normalizeHistory = (rawHistory: unknown): ChatMessage[] => {
  if (!Array.isArray(rawHistory)) return [];

  return rawHistory
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const role = String((entry as Record<string, unknown>).role || "");
      const content = String((entry as Record<string, unknown>).content || "")
        .trim()
        .slice(0, 1200);
      if (!content) return null;
      if (role !== "user" && role !== "assistant") return null;
      return { role, content } as ChatMessage;
    })
    .filter((entry): entry is ChatMessage => Boolean(entry))
    .slice(-8);
};

const getAppDataContext = async () => {
  const [
    usersCount,
    greenSpacesCount,
    treesCount,
    treeTypesCount,
    reportsCount,
    proposalsCount,
    projectsCount,
    latestGreenSpaces,
    proposalStatuses,
  ] = await Promise.all([
    User.count(),
    GreenSpace.count(),
    TreeInventory.count(),
    TreeType.count(),
    ReportOfGreenArea.count(),
    ProposalOfGreenArea.count(),
    ProjectOfProposal.count(),
    GreenSpace.findAll({
      attributes: ["name", "location", "trees_count", "total_area_m2"],
      order: [["updated_at", "DESC"]],
      limit: 5,
    }),
    ProposalOfGreenArea.findAll({
      attributes: ["status"],
    }),
  ]);

  const statuses = proposalStatuses.reduce<Record<string, number>>(
    (acc, row) => {
      const status = String(row.getDataValue("status") || "unknown");
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {},
  );

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      users: usersCount,
      greenSpaces: greenSpacesCount,
      trees: treesCount,
      treeTypes: treeTypesCount,
      reports: reportsCount,
      proposals: proposalsCount,
      projects: projectsCount,
    },
    proposalStatuses: statuses,
    highlightedGreenSpaces: latestGreenSpaces.map((space) => ({
      name: String(space.getDataValue("name") || ""),
      location: String(space.getDataValue("location") || ""),
      treesCount: Number(space.getDataValue("trees_count") || 0),
      totalAreaM2: Number(space.getDataValue("total_area_m2") || 0),
    })),
  };
};

const buildFallbackReply = (
  appDataContext: Awaited<ReturnType<typeof getAppDataContext>>,
) => {
  const statuses = Object.entries(appDataContext.proposalStatuses)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");
  return [
    "No pude conectarme con Gemini en este momento.",
    "Resumen rapido de la plataforma:",
    `Usuarios: ${appDataContext.totals.users}`,
    `Areas verdes: ${appDataContext.totals.greenSpaces}`,
    `Arboles: ${appDataContext.totals.trees}`,
    `Tipos de arbol: ${appDataContext.totals.treeTypes}`,
    `Reportes: ${appDataContext.totals.reports}`,
    `Propuestas: ${appDataContext.totals.proposals}`,
    `Proyectos: ${appDataContext.totals.projects}`,
    statuses ? `Estados de propuestas: ${statuses}` : "",
    "Intenta nuevamente en unos segundos.",
  ]
    .filter(Boolean)
    .join("\n");
};

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const message = String(req.body?.message || "").trim();
  const history = normalizeHistory(req.body?.history);

  if (!message) {
    return res.status(400).json({ error: "Debes escribir un mensaje" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: "La variable GEMINI_API_KEY no esta configurada en el servidor.",
    });
  }

  try {
    const appDataContext = await getAppDataContext();

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `Contexto de datos actualizados de la aplicacion (JSON):\n${JSON.stringify(
              appDataContext,
              null,
              2,
            )}`,
          },
        ],
      },
      ...history.map((entry) => ({
        role: entry.role === "assistant" ? "model" : "user",
        parts: [{ text: entry.content }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const modelCandidates = Array.from(
      new Set([GEMINI_MODEL, "gemini-3.6-flash-lite", "gemini-3.6-flash"]),
    );

    const requestBody = {
      systemInstruction: {
        parts: [
          {
            text: "Eres un asistente de una plataforma de ecologia universitaria. Responde SIEMPRE en espanol claro. Si preguntan por datos de la app, usa el contexto JSON dado y di cuando algo no este disponible. No inventes metricas.",
          },
        ],
      },
      contents,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: Math.max(200, GEMINI_MAX_OUTPUT_TOKENS),
      },
    };

    const modelErrors: string[] = [];

    for (const model of modelCandidates) {
      const abortController = new AbortController();
      const timeout = setTimeout(
        () => abortController.abort(),
        Math.max(10000, GEMINI_TIMEOUT_MS),
      );
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            model,
          )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: abortController.signal,
          },
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          modelErrors.push(
            `${model}: HTTP ${geminiResponse.status} - ${errorText.slice(0, 180)}`,
          );
          continue;
        }

        const payload = (await geminiResponse.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{
                text?: string;
              }>;
            };
          }>;
        };

        const reply =
          payload.candidates?.[0]?.content?.parts
            ?.map((part) => String(part.text || ""))
            .join("\n")
            .trim() || "No pude generar una respuesta en este momento.";

        clearTimeout(timeout);
        return res.json({
          reply,
          generatedAt: new Date().toISOString(),
          model,
        });
      } catch (error) {
        const message =
          error instanceof Error && error.name === "AbortError"
            ? `Tiempo de espera agotado tras ${Math.max(10000, GEMINI_TIMEOUT_MS)}ms`
            : error instanceof Error
              ? error.message
              : String(error);
        modelErrors.push(`${model}: ${message}`);
      } finally {
        clearTimeout(timeout);
      }
    }

    console.error("Gemini upstream error:", modelErrors.join(" | "));
    return res.json({
      reply: buildFallbackReply(appDataContext),
      generatedAt: new Date().toISOString(),
      warning: "Gemini no disponible temporalmente",
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({
      error: "No se pudo procesar la consulta con IA",
    });
  }
});

export default router;
