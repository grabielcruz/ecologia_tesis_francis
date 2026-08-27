import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  Role,
  User,
  GreenSpaceReview,
  ReportOfGreenArea,
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

router.use(authenticate, requireAdmin);

const FIXED_ROLE_NAMES = new Set(["admin", "regular"]);

router.get("/roles", async (_req, res) => {
  const roles = await Role.findAll({ order: [["role_id", "ASC"]] });
  res.json(
    roles.map((role) => ({
      id: role.getDataValue("role_id"),
      name: role.getDataValue("role_name"),
      description: role.getDataValue("description"),
    })).filter((role) => FIXED_ROLE_NAMES.has(String(role.name))),
  );
});

router.get("/users", async (_req, res) => {
  const users = await User.findAll({
    include: [{ model: Role, attributes: ["role_id", "role_name"] }],
    order: [["user_id", "ASC"]],
  });

  res.json(
    users.map((user) => {
      const role = user.get("Role") as Role | undefined;
      return {
        id: user.getDataValue("user_id"),
        name: user.getDataValue("name"),
        username: user.getDataValue("username"),
        email: user.getDataValue("email"),
        isActive: Boolean(user.getDataValue("is_active")),
        roleId: user.getDataValue("role_id"),
        roleName: role?.getDataValue("role_name") || "",
      };
    }),
  );
});

router.post("/users", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");
  const roleId = Number(req.body?.roleId);
  const isActive = req.body?.isActive === undefined ? true : Boolean(req.body?.isActive);

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "Nombre, usuario, correo y contrasena son obligatorios" });
  }

  if (!Number.isFinite(roleId)) {
    return res.status(400).json({ error: "Rol invalido" });
  }

  const role = await Role.findByPk(roleId);
  if (!role) {
    return res.status(400).json({ error: "El rol no existe" });
  }

  if (!FIXED_ROLE_NAMES.has(String(role.getDataValue("role_name") || ""))) {
    return res.status(400).json({ error: "Solo se permiten roles fijos: admin y regular" });
  }

  const byUsername = await User.findOne({ where: { username } });
  if (byUsername) {
    return res.status(409).json({ error: "El nombre de usuario ya existe" });
  }

  const byEmail = await User.findOne({ where: { email } });
  if (byEmail) {
    return res.status(409).json({ error: "El correo ya existe" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    username,
    email,
    password_hash: passwordHash,
    avatar_url: "",
    is_active: isActive,
    role_id: roleId,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return res.status(201).json({
    id: user.getDataValue("user_id"),
    name: user.getDataValue("name"),
    username: user.getDataValue("username"),
    email: user.getDataValue("email"),
    isActive: Boolean(user.getDataValue("is_active")),
    roleId: user.getDataValue("role_id"),
  });
});

router.put("/users/:id", async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Identificador de usuario invalido" });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const name = String(req.body?.name || user.getDataValue("name")).trim();
  const username = String(req.body?.username || user.getDataValue("username")).trim();
  const email = String(req.body?.email || user.getDataValue("email")).trim();
  const roleId = Number(
    req.body?.roleId === undefined ? user.getDataValue("role_id") : req.body?.roleId,
  );
  const isActive =
    req.body?.isActive === undefined
      ? Boolean(user.getDataValue("is_active"))
      : Boolean(req.body?.isActive);
  const password = String(req.body?.password || "").trim();

  if (!name || !username || !email) {
    return res.status(400).json({ error: "Nombre, usuario y correo son obligatorios" });
  }

  if (!Number.isFinite(roleId)) {
    return res.status(400).json({ error: "Rol invalido" });
  }

  const role = await Role.findByPk(roleId);
  if (!role) {
    return res.status(400).json({ error: "El rol no existe" });
  }

  const currentRole = await Role.findByPk(user.getDataValue("role_id"));
  if (
    String(user.getDataValue("username") || "") === "admin" &&
    String(currentRole?.getDataValue("role_name") || "") === "admin" &&
    roleId !== Number(user.getDataValue("role_id"))
  ) {
    return res.status(409).json({ error: "No se puede cambiar el rol del usuario administrador original" });
  }

  if (!FIXED_ROLE_NAMES.has(String(role.getDataValue("role_name") || ""))) {
    return res.status(400).json({ error: "Solo se permiten roles fijos: admin y regular" });
  }

  const byUsername = await User.findOne({ where: { username } });
  if (byUsername && byUsername.getDataValue("user_id") !== userId) {
    return res.status(409).json({ error: "El nombre de usuario ya existe" });
  }

  const byEmail = await User.findOne({ where: { email } });
  if (byEmail && byEmail.getDataValue("user_id") !== userId) {
    return res.status(409).json({ error: "El correo ya existe" });
  }

  const updatePayload: Record<string, unknown> = {
    name,
    username,
    email,
    role_id: roleId,
    is_active: isActive,
    updated_at: new Date(),
  };

  if (password) {
    updatePayload.password_hash = await bcrypt.hash(password, 10);
  }

  await user.update(updatePayload);

  return res.json({
    id: user.getDataValue("user_id"),
    name: user.getDataValue("name"),
    username: user.getDataValue("username"),
    email: user.getDataValue("email"),
    isActive: Boolean(user.getDataValue("is_active")),
    roleId: user.getDataValue("role_id"),
  });
});

router.delete("/users/:id", async (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Identificador de usuario invalido" });
  }

  if (req.user?.user_id === userId) {
    return res.status(409).json({ error: "No puedes eliminar tu propio usuario" });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const userRole = await Role.findByPk(user.getDataValue("role_id"));
  if (
    String(user.getDataValue("username") || "") === "admin" &&
    String(userRole?.getDataValue("role_name") || "") === "admin"
  ) {
    return res.status(409).json({ error: "No se puede eliminar el usuario administrador original" });
  }

  const [reviewCount, reportCount, proposalCount, voteCount] = await Promise.all([
    GreenSpaceReview.count({ where: { user_id: userId } }),
    ReportOfGreenArea.count({ where: { user_id: userId } }),
    ProposalOfGreenArea.count({ where: { user_id: userId } }),
    VoteOfProposal.count({ where: { user_id: userId } }),
  ]);

  const totalLinkedRecords =
    reviewCount + reportCount + proposalCount + voteCount;
  if (totalLinkedRecords > 0) {
    return res.status(409).json({
      error:
        "No se puede eliminar este usuario porque tiene registros asociados en otras tablas",
    });
  }

  await user.destroy();
  return res.json({ ok: true });
});

export default router;
