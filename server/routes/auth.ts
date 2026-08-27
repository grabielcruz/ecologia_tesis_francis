import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role, User } from "../models";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

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

router.all("*", (_req, res) => {
  res.status(501).json({ error: "Auth endpoints pending implementation" });
});

export default router;
