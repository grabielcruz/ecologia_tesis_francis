import { Router } from "express";
import { Op } from "sequelize";
import { Survey, Response, Suggestion } from "../models";

const router = Router();

router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(20, Number(req.query.limit) || 5));
  const offset = (page - 1) * limit;
  const adminMode = req.query.admin === "true";
  const search = req.query.search ? String(req.query.search).trim() : "";
  const filterType = req.query.type ? String(req.query.type) : "all";
  const status = req.query.status ? String(req.query.status) : "all";

  const where: any = {};
  if (!adminMode) {
    where.active = true;
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  if (filterType === "yesno" || filterType === "rating") {
    where.type = filterType;
  }

  if (status === "active") {
    where.active = true;
  } else if (status === "inactive") {
    where.active = false;
  }

  const count = await Survey.count({ where });
  const sort = req.query.sort === "asc" ? "ASC" : "DESC";
  const rows = await Survey.findAll({
    where,
    limit,
    offset,
    order: [["updatedAt", sort], ["id", sort]],
  });

  const surveyTitles = rows.map((survey) => survey.title);
  const responses = await Response.findAll({ where: { surveyTitle: surveyTitles } });

  const summaryByTitle: Record<
    string,
    { totalResponses: number; yesCount: number; noCount: number; ratingTotal: number }
  > = {};

  for (const response of responses) {
    const title = response.surveyTitle;
    if (!summaryByTitle[title]) {
      summaryByTitle[title] = { totalResponses: 0, yesCount: 0, noCount: 0, ratingTotal: 0 };
    }

    const payload = typeof response.answers === "string" ? JSON.parse(response.answers) : response.answers;
    const answer = payload?.answer;
    summaryByTitle[title].totalResponses += 1;

    if (answer === "yes") {
      summaryByTitle[title].yesCount += 1;
    } else if (answer === "no") {
      summaryByTitle[title].noCount += 1;
    } else if (!Number.isNaN(Number(answer))) {
      summaryByTitle[title].ratingTotal += Number(answer);
    }
  }

  const surveysWithSummary = rows.map((survey) => {
    const base = survey.toJSON();
    const summary = summaryByTitle[survey.title] || { totalResponses: 0, yesCount: 0, noCount: 0, ratingTotal: 0 };
    const summaryData: any = { totalResponses: summary.totalResponses };

    if (survey.type === "yesno") {
      summaryData.yesCount = summary.yesCount;
      summaryData.noCount = summary.noCount;
    }

    if (survey.type === "rating") {
      summaryData.average = summary.totalResponses ? summary.ratingTotal / summary.totalResponses : 0;
    }

    return {
      ...base,
      summary: summaryData,
    };
  });

  res.json({
    surveys: surveysWithSummary,
    total: count,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(count / limit)),
  });
});

router.post("/:id/responses", async (req, res) => {
  const { id } = req.params;
  const { username, answers } = req.body;

  if (!username || !answers) {
    return res.status(400).json({ error: "Faltan datos de usuario o respuesta" });
  }

  const survey = await Survey.findByPk(id);
  if (!survey) {
    return res.status(404).json({ error: "Encuesta no encontrada" });
  }

  const response = await Response.create({
    surveyTitle: survey.title,
    username,
    answers: typeof answers === "string" ? answers : JSON.stringify(answers),
  });

  res.status(201).json(response);
});

router.post("/", async (req, res) => {
  const { title, description, type, active } = req.body;
  const survey = await Survey.create({
    title,
    description,
    type: type || "yesno",
    active: active ?? true,
  });
  res.status(201).json(survey);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, type, active } = req.body;
  const survey = await Survey.findByPk(id);
  if (!survey) return res.status(404).json({ error: "Encuesta no encontrada" });

  await survey.update({ title, description, type, active });
  res.json(survey);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const survey = await Survey.findByPk(id);
  if (!survey) return res.status(404).json({ error: "Encuesta no encontrada" });

  await survey.destroy();
  res.status(204).end();
});


export default router;
