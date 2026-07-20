import { Router } from "express";
import { Suggestion } from "../models";

const router = Router();

router.post("/", async (req, res) => {
  const { title, description, userId } = req.body;
  const suggestion = await Suggestion.create({ title, description, userId, reviewed: false });
  res.status(201).json(suggestion);
});

export default router;
