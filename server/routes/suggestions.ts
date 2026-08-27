import { Router } from "express";

const router = Router();

router.all("*", (_req, res) => {
  res.status(501).json({ error: "Suggestion module pending implementation" });
});

export default router;
