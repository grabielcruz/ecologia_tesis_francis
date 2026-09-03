import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { Role, User } from "../models";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const avatarUploadsDir = path.resolve(process.cwd(), "public", "uploads", "avatars");

if (!fs.existsSync(avatarUploadsDir)) {
  fs.mkdirSync(avatarUploadsDir, { recursive: true });
}

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

const canEditUser = (req: AuthRequest, targetUserId: number) => {
  if (!req.user) return false;
  return req.user.role === "admin" || req.user.user_id === targetUserId;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imagenes") as any, false);
    }
    cb(null, true);
  },
});

router.post("/login", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contrasena son obligatorios" });
  }

  const user = await User.findOne({
    where: { username },
    include: [{ model: Role, attributes: ["role_name"] }],
  });

  if (!user) {
    return res.status(401).json({ error: "Credenciales invalidas" });
  }

  const passwordHash = String(user.getDataValue("password_hash") || "");
  const validPassword = await bcrypt.compare(password, passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Credenciales invalidas" });
  }

  const isActive = Boolean(user.getDataValue("is_active"));
  if (!isActive) {
    return res.status(403).json({ error: "Usuario inactivo" });
  }

  const roleRecord = user.get("Role") as Role | undefined;
  const roleName = roleRecord?.getDataValue("role_name") || "regular";

  const token = jwt.sign(
    {
      user_id: user.getDataValue("user_id"),
      role: roleName,
    },
    JWT_SECRET,
    { expiresIn: "8h" },
  );

  return res.json({
    token,
    user: {
      id: user.getDataValue("user_id"),
      name: user.getDataValue("name"),
      username: user.getDataValue("username"),
      email: user.getDataValue("email"),
      role: roleName,
      points: 0,
      avatarUrl: user.getDataValue("avatar_url"),
    },
  });
});

router.post("/register", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "Completa todos los campos obligatorios" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "La contrasena debe tener al menos 8 caracteres" });
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    return res.status(409).json({ error: "El nombre de usuario ya existe" });
  }

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(409).json({ error: "El correo ya esta registrado" });
  }

  const regularRole =
    (await Role.findOne({ where: { role_name: "regular" } })) ||
    (await Role.findOne({ order: [["role_id", "ASC"]] }));

  if (!regularRole) {
    return res.status(500).json({ error: "No hay roles disponibles" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await User.create({
    name,
    username,
    email,
    password_hash: passwordHash,
    avatar_url: "",
    is_active: true,
    role_id: regularRole.getDataValue("role_id"),
    created_at: new Date(),
    updated_at: new Date(),
  });

  return res.status(201).json({
    id: created.getDataValue("user_id"),
    name: created.getDataValue("name"),
    username: created.getDataValue("username"),
    email: created.getDataValue("email"),
    role: regularRole.getDataValue("role_name"),
    points: 0,
    avatarUrl: created.getDataValue("avatar_url"),
  });
});

router.put("/profile/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Identificador invalido" });
  }

  if (!canEditUser(req, userId)) {
    return res.status(403).json({ error: "No autorizado" });
  }

  const row = await User.findByPk(userId, {
    include: [{ model: Role, attributes: ["role_name"] }],
  });

  if (!row) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date(),
  };

  const nextName = req.body?.name;
  const nextUsername = req.body?.username;
  const nextEmail = req.body?.email;
  const nextAvatarUrl = req.body?.avatarUrl;
  const oldPassword = req.body?.oldPassword;
  const nextPassword = req.body?.password;

  if (typeof nextName === "string" && nextName.trim()) {
    updates.name = nextName.trim();
  }

  if (typeof nextUsername === "string" && nextUsername.trim()) {
    const usernameTaken = await User.findOne({ where: { username: nextUsername.trim() } });
    if (
      usernameTaken &&
      Number(usernameTaken.getDataValue("user_id")) !== Number(row.getDataValue("user_id"))
    ) {
      return res.status(409).json({ error: "El nombre de usuario ya existe" });
    }
    updates.username = nextUsername.trim();
  }

  if (typeof nextEmail === "string" && nextEmail.trim()) {
    const emailTaken = await User.findOne({ where: { email: nextEmail.trim() } });
    if (
      emailTaken &&
      Number(emailTaken.getDataValue("user_id")) !== Number(row.getDataValue("user_id"))
    ) {
      return res.status(409).json({ error: "El correo ya esta registrado" });
    }
    updates.email = nextEmail.trim();
  }

  if (typeof nextAvatarUrl === "string") {
    updates.avatar_url = nextAvatarUrl.trim();
  }

  if (typeof nextPassword === "string" && nextPassword.length > 0) {
    if (nextPassword.length < 8) {
      return res.status(400).json({ error: "La contrasena debe tener al menos 8 caracteres" });
    }

    if (!oldPassword || typeof oldPassword !== "string") {
      return res.status(400).json({ error: "Debes ingresar la contrasena actual" });
    }

    const currentHash = String(row.getDataValue("password_hash") || "");
    const oldMatches = await bcrypt.compare(oldPassword, currentHash);
    if (!oldMatches) {
      return res.status(400).json({ error: "La contrasena actual es incorrecta" });
    }

    updates.password_hash = await bcrypt.hash(nextPassword, 10);
  }

  await row.update(updates);

  const roleRecord = row.get("Role") as Role | undefined;
  const roleName = roleRecord?.getDataValue("role_name") || req.user?.role || "regular";

  return res.json({
    id: row.getDataValue("user_id"),
    name: row.getDataValue("name"),
    username: row.getDataValue("username"),
    email: row.getDataValue("email"),
    role: roleName,
    points: 0,
    avatarUrl: row.getDataValue("avatar_url"),
  });
});

router.post(
  "/profile/:id/avatar",
  authenticate,
  upload.single("avatar"),
  async (req: AuthRequest, res: Response) => {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "Identificador invalido" });
    }

    if (!canEditUser(req, userId)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const row = await User.findByPk(userId);
    if (!row) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ error: "No se recibio ninguna imagen" });
    }

    try {
      const filename = `avatar-${userId}-${Date.now()}.jpg`;
      const outputPath = path.join(avatarUploadsDir, filename);

      await sharp(file.buffer)
        .resize(900, 900, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 84 })
        .toFile(outputPath);

      const avatarUrl = `/uploads/avatars/${filename}`;
      await row.update({
        avatar_url: avatarUrl,
        updated_at: new Date(),
      });

      return res.status(201).json({ avatarUrl });
    } catch {
      return res.status(500).json({ error: "No se pudo subir la imagen" });
    }
  },
);

router.all("*", (_req, res) => {
  res.status(404).json({ error: "Endpoint de autenticacion no encontrado" });
});

export default router;
