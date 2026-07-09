import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage so we can resize before saving
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Solo se permiten imágenes") as any, false);
    cb(null, true);
  },
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ error: "Credenciales inválidas" });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "8h",
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      email: user.email,
      points: user.points,
      avatarUrl: user.avatarUrl,
    },
  });
});

router.post("/register", async (req, res) => {
  const { name, username, password, email } = req.body;
  const hash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ where: { username } });
  if (existing) return res.status(400).json({ error: "Usuario ya existe" });

  const user = await User.create({ name, username, password: hash, email, role: "student", points: 0 });
  res.status(201).json({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
});

router.post("/reset-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({ message: "Se ha enviado un enlace de recuperación al correo" });
});

router.put("/profile/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, username, email, password, oldPassword, avatarUrl } = req.body;

  if (!req.user) {
    return res.status(401).json({ error: "Token inválido" });
  }

  if (req.user.id !== Number(id) && req.user.role !== "admin") {
    return res.status(403).json({ error: "No autorizado" });
  }

  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  try {
    const updates: any = {};
    if (name) updates.name = name;
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (avatarUrl) updates.avatarUrl = avatarUrl;

    if (password) {
      if (req.user.role !== "admin" || req.user.id === Number(id)) {
        if (!oldPassword) {
          return res.status(400).json({ error: "Se requiere la contraseña actual para cambiar la contraseña." });
        }

        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
          return res.status(401).json({ error: "Contraseña actual incorrecta." });
        }
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    await user.update(updates);

    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      points: user.points,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo actualizar el perfil" });
  }
});

// Upload avatar file (multipart) and update user's avatarUrl
router.post("/profile/:id/avatar", authenticate, upload.single("avatar"), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!req.user) return res.status(401).json({ error: "Token inválido" });
  if (req.user.id !== Number(id) && req.user.role !== "admin") return res.status(403).json({ error: "No autorizado" });
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  if (!req.file) return res.status(400).json({ error: "Archivo no proporcionado" });
  try {
    const filename = `${req.user.id}-${Date.now()}.jpg`;
    const outPath = path.join(uploadsDir, filename);
    // Resize image with sharp
    await sharp(req.file.buffer)
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(outPath);

    const avatarUrl = `/uploads/${filename}`;
    await user.update({ avatarUrl });
    res.json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo subir el avatar" });
  }
});

export default router;

