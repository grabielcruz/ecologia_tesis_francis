import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { User, Survey, Response, initializeDatabase } from "./models";
import seeds from "./seeds.json";

export async function seedDatabase() {
  // Seed users
  for (const u of (seeds as any).users) {
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ username: u.username }, { email: u.email }],
      },
    });

    const hash = await bcrypt.hash(u.password, 10);
    if (existing) {
      await existing.update({
        name: u.name || u.username,
        username: u.username,
        password: hash,
        role: u.role,
        email: u.email,
        points: u.points ?? 0,
      });
      console.log(`Updated existing user ${u.username} / ${u.email}`);
      continue;
    }

    await User.create({
      name: u.name || u.username,
      username: u.username,
      password: hash,
      role: u.role,
      email: u.email,
      points: u.points ?? 0,
    });
  }

  // Seed surveys
  for (const s of (seeds as any).surveys) {
    const existing = await Survey.findOne({ where: { title: s.title } });
    if (existing) continue;
    await Survey.create({
      title: s.title,
      description: s.description,
      type: s.type ?? "yesno",
      active: s.active ?? true,
    });
  }

  // Seed responses
  for (const r of (seeds as any).responses || []) {
    const existing = await Response.findOne({
      where: { surveyTitle: r.surveyTitle, username: r.username },
    });

    const answerData = typeof r.answers === "string" ? r.answers : JSON.stringify(r.answers);
    if (existing) {
      await existing.update({ answers: answerData });
      continue;
    }

    await Response.create({
      surveyTitle: r.surveyTitle,
      username: r.username,
      answers: answerData,
    });
  }

  console.log("Seeding complete.");
}

if (require.main === module) {
  initializeDatabase()
    .then(seedDatabase)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
