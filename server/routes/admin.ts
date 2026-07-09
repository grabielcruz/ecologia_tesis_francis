import { Router } from "express";
import { Survey } from "../models";

const router = Router();

router.get("/surveys", async (req, res) => {
  const surveys = await Survey.findAll();
  res.json(surveys);
});

router.post("/surveys", async (req, res) => {
  const { title, description, active } = req.body;
  const survey = await Survey.create({ title, description, active: active ?? true });
  res.status(201).json(survey);
});

router.put("/surveys/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, active } = req.body;
  const survey = await Survey.findByPk(id);
  if (!survey) return res.status(404).json({ error: "Encuesta no encontrada" });

  await survey.update({ title, description, active });
  res.json(survey);
});

router.delete("/surveys/:id", async (req, res) => {
  const { id } = req.params;
  const survey = await Survey.findByPk(id);
  if (!survey) return res.status(404).json({ error: "Encuesta no encontrada" });

  await survey.destroy();
  res.status(204).end();
});


export default router;
