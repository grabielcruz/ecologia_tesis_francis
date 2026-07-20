import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import {
  User,
  Survey,
  Response,
  GreenSpace,
  GreenSpaceReview,
  initializeDatabase,
} from "./models";
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

    const answerData =
      typeof r.answers === "string" ? r.answers : JSON.stringify(r.answers);
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

  // Seed green spaces
  for (const g of (seeds as any).greenSpaces || []) {
    const existing = await GreenSpace.findOne({ where: { name: g.name } });
    const payload = {
      name: g.name,
      location: g.location,
      totalAreaM2: Number(g.totalAreaM2) || 0,
      tallTreeCount: Number(g.tallTreeCount) || 0,
      images: JSON.stringify(Array.isArray(g.images) ? g.images : []),
    };

    if (existing) {
      await existing.update(payload);
      continue;
    }

    await GreenSpace.create(payload);
  }

  // Seed green space reviews
  for (const r of (seeds as any).greenSpaceReviews || []) {
    const space = await GreenSpace.findOne({
      where: { name: r.greenSpaceName },
    });
    if (!space) continue;

    const existing = await GreenSpaceReview.findOne({
      where: {
        greenSpaceId: space.id,
        username: r.username,
      },
    });

    const payload = {
      greenSpaceId: space.id,
      username: r.username,
      rating: Number(r.rating) || 0,
      comment: r.comment || "",
    };

    if (existing) {
      await existing.update(payload);
      continue;
    }

    await GreenSpaceReview.create(payload);
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
