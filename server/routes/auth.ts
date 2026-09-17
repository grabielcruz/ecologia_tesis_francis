import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import { Role, User } from "../models";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../utils/mailer";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const PASSWORD_RESET_EXPIRATION_MINUTES = Number(
  process.env.PASSWORD_RESET_EXPIRATION_MINUTES || 30,
);
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";
const avatarUploadsDir = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "avatars",
);

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
    return res.status(401).json({ error: "Token inválido" });
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
      return cb(new Error("Solo se permiten imágenes") as any, false);
    }
    cb(null, true);
  },
});

const createPasswordResetToken = (userId: number, passwordHash: string) => {
  const secret = `${JWT_SECRET}:${passwordHash}`;
  return jwt.sign({ user_id: userId, purpose: "password-reset" }, secret, {
    expiresIn: Math.max(1, PASSWORD_RESET_EXPIRATION_MINUTES) * 60,
  });
};

const getPasswordResetUserFromToken = async (token: string) => {
  const decoded = jwt.decode(token) as {
    user_id?: number;
    purpose?: string;
  } | null;
  const userId = Number(decoded?.user_id);
  if (
    !decoded ||
    decoded.purpose !== "password-reset" ||
    !Number.isFinite(userId)
  ) {
    return null;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return null;
  }

  const passwordHash = String(user.getDataValue("password_hash") || "");
  const secret = `${JWT_SECRET}:${passwordHash}`;

  try {
    jwt.verify(token, secret);
    return user;
  } catch {
    return null;
  }
};

const isStrongPassword = (value: string) => {
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasDigit = /\d/.test(value);
  return hasUppercase && hasLowercase && hasDigit;
};

router.post("/login", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Usuario y contraseña son obligatorios" });
  }

  const user = await User.findOne({
    where: { username },
    include: [{ model: Role, attributes: ["role_name"] }],
  });

  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const passwordHash = String(user.getDataValue("password_hash") || "");
  const validPassword = await bcrypt.compare(password, passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Credenciales inválidas" });
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

  const missingFields: string[] = [];
  if (!name) missingFields.push("nombre completo");
  if (!username) missingFields.push("nombre de usuario");
  if (!email) missingFields.push("correo");
  if (!password) missingFields.push("contraseña");

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Completa los campos obligatorios: ${missingFields.join(", ")}`,
    });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error:
        "La contraseña es muy débil. Usa al menos una mayúscula, una minúscula y un número",
    });
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    return res.status(409).json({ error: "El nombre de usuario ya existe" });
  }

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(409).json({ error: "El correo ya está registrado" });
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

  try {
    await sendWelcomeEmail({
      to: created.getDataValue("email"),
      name: created.getDataValue("name"),
    });
  } catch (error) {
    console.warn("No se pudo enviar correo de bienvenida", error);
  }

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

router.post("/forgot-password", async (req, res) => {
  const identifier = String(
    req.body?.identifier || req.body?.email || "",
  ).trim();

  if (!identifier) {
    return res
      .status(400)
      .json({ error: "Debes indicar tu correo o nombre de usuario" });
  }

  const user = await User.findOne({
    where: {
      [Op.or]: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    return res.json({
      message:
        "Si la cuenta existe, recibirás un correo con instrucciones para recuperar la contraseña.",
    });
  }

  const token = createPasswordResetToken(
    user.getDataValue("user_id"),
    String(user.getDataValue("password_hash") || ""),
  );
  const resetLink = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail({
      to: user.getDataValue("email"),
      name: user.getDataValue("name"),
      resetLink,
    });
  } catch (error) {
    console.warn("No se pudo enviar correo de recuperación", error);
  }

  return res.json({
    message:
      "Si la cuenta existe, recibirás un correo con instrucciones para recuperar la contraseña.",
  });
});

router.get("/reset-password/validate", async (req, res) => {
  const token = String(req.query?.token || "").trim();
  if (!token) {
    return res.status(400).json({ error: "Token de recuperación inválido" });
  }

  const user = await getPasswordResetUserFromToken(token);
  if (!user) {
    return res
      .status(400)
      .json({ error: "El enlace de recuperación es inválido o expiró" });
  }

  return res.json({ ok: true });
});

router.post("/reset-password", async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const newPassword = String(req.body?.password || "");

  if (!token) {
    return res.status(400).json({ error: "Token de recuperación inválido" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  const user = await getPasswordResetUserFromToken(token);
  if (!user) {
    return res
      .status(400)
      .json({ error: "El enlace de recuperación es inválido o expiró" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await user.update({
    password_hash: passwordHash,
    updated_at: new Date(),
  });

  return res.json({ message: "Contraseña actualizada correctamente" });
});

router.put(
  "/profile/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "Identificador inválido" });
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
      const usernameTaken = await User.findOne({
        where: { username: nextUsername.trim() },
      });
      if (
        usernameTaken &&
        Number(usernameTaken.getDataValue("user_id")) !==
          Number(row.getDataValue("user_id"))
      ) {
        return res
          .status(409)
          .json({ error: "El nombre de usuario ya existe" });
      }
      updates.username = nextUsername.trim();
    }

    if (typeof nextEmail === "string" && nextEmail.trim()) {
      const emailTaken = await User.findOne({
        where: { email: nextEmail.trim() },
      });
      if (
        emailTaken &&
        Number(emailTaken.getDataValue("user_id")) !==
          Number(row.getDataValue("user_id"))
      ) {
        return res.status(409).json({ error: "El correo ya está registrado" });
      }
      updates.email = nextEmail.trim();
    }

    if (typeof nextAvatarUrl === "string") {
      updates.avatar_url = nextAvatarUrl.trim();
    }

    if (typeof nextPassword === "string" && nextPassword.length > 0) {
      if (nextPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "La contraseña debe tener al menos 8 caracteres" });
      }

      if (!oldPassword || typeof oldPassword !== "string") {
        return res
          .status(400)
          .json({ error: "Debes ingresar la contraseña actual" });
      }

      const currentHash = String(row.getDataValue("password_hash") || "");
      const oldMatches = await bcrypt.compare(oldPassword, currentHash);
      if (!oldMatches) {
        return res
          .status(400)
          .json({ error: "La contraseña actual es incorrecta" });
      }

      updates.password_hash = await bcrypt.hash(nextPassword, 10);
    }

    await row.update(updates);

    const roleRecord = row.get("Role") as Role | undefined;
    const roleName =
      roleRecord?.getDataValue("role_name") || req.user?.role || "regular";

    return res.json({
      id: row.getDataValue("user_id"),
      name: row.getDataValue("name"),
      username: row.getDataValue("username"),
      email: row.getDataValue("email"),
      role: roleName,
      points: 0,
      avatarUrl: row.getDataValue("avatar_url"),
    });
  },
);

router.post(
  "/profile/:id/avatar",
  authenticate,
  upload.single("avatar"),
  async (req: AuthRequest, res: Response) => {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "Identificador inválido" });
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
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
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
