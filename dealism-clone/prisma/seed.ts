import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  // Lowercase to match the canonical form everywhere else (register, auth,
  // invitations) so the @unique constraint actually dedupes.
  const email = (process.env.ADMIN_EMAIL || "admin@dealism.local").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashed = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: "admin", password: hashed },
    });
    console.log(`✓ Admin user already exists: ${email} — role ensured, password reset.`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: "Admin",
        role: "admin",
        plan: "enterprise",
        conversationsQuota: 100000,
      },
    });
    console.log(`✓ Admin user created: ${email}`);
  }

  // Default plans (if none exist)
  const planCount = await prisma.plan.count();
  if (planCount === 0) {
    await prisma.plan.createMany({
      data: [
        {
          name: "Starter",
          slug: "monthly_basic",
          priceMonthly: 19,
          priceAnnual: null,
          conversationsQuota: 1000,
          features: JSON.stringify([
            "1,000 Conversations / month",
            "Unlimited agents",
            "Auto-built knowledge base",
            "Continuous learning",
            "Multilingual support",
            "Autoreply + copilot",
          ]),
          isPopular: false,
          sortOrder: 0,
          isActive: true,
        },
        {
          name: "Pro",
          slug: "monthly_pro",
          priceMonthly: 39,
          priceAnnual: null,
          conversationsQuota: 2000,
          features: JSON.stringify([
            "2,000 Conversations / month",
            "Unlimited agents",
            "Auto-built knowledge base",
            "Continuous learning",
            "Multilingual support",
            "Autoreply + copilot",
            "Priority support",
          ]),
          isPopular: true,
          sortOrder: 1,
          isActive: true,
        },
        {
          name: "Pro Annual",
          slug: "annual",
          priceMonthly: 32,
          priceAnnual: 384,
          conversationsQuota: 2000,
          features: JSON.stringify([
            "2,000 Conversations / month",
            "All Pro features",
            "Billed annually — save 18%",
          ]),
          isPopular: false,
          sortOrder: 2,
          isActive: true,
        },
        {
          name: "Enterprise",
          slug: "enterprise",
          priceMonthly: 0,
          priceAnnual: null,
          conversationsQuota: 0,
          features: JSON.stringify([
            "Custom conversations quota",
            "Custom agents & knowledge base",
            "SLA & dedicated support",
            "Team / multi-brand seats",
          ]),
          isPopular: false,
          sortOrder: 3,
          isActive: true,
        },
      ],
    });
    console.log(`✓ Seeded 4 default plans`);
  }

  // Default settings
  const defaults: Array<[string, string, string]> = [
    ["brand_name", "Dealism", "branding"],
    ["brand_tagline", "Your Best Sales Rep, Now AI.", "branding"],
    ["allow_signups", "true", "general"],
    ["default_trial_quota", "100", "general"],
    ["openai_model", process.env.OPENAI_MODEL || "gpt-4o-mini", "api"],
  ];
  for (const [key, value, category] of defaults) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value, category },
    });
  }
  if (process.env.OPENAI_API_KEY) {
    await prisma.setting.upsert({
      where: { key: "openai_api_key" },
      update: { value: process.env.OPENAI_API_KEY },
      create: { key: "openai_api_key", value: process.env.OPENAI_API_KEY, category: "api" },
    });
    console.log("✓ OpenAI API key loaded from .env");
  }
  console.log("✓ Default settings ensured");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
