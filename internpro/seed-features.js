const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  // Seed default badges
  const badges = [
    { name: "First Steps", description: "Earned your first 10 points", icon: "🌟", category: "milestone", threshold: 10 },
    { name: "Rising Star", description: "Earned 50 points", icon: "⭐", category: "milestone", threshold: 50 },
    { name: "Point Master", description: "Earned 100 points", icon: "💫", category: "milestone", threshold: 100 },
    { name: "Champion", description: "Earned 500 points", icon: "🏆", category: "milestone", threshold: 500 },
    { name: "Legend", description: "Earned 1000 points", icon: "👑", category: "milestone", threshold: 1000 },
    { name: "7 Day Streak", description: "7 consecutive days attendance", icon: "🔥", category: "streak", threshold: 7 },
    { name: "30 Day Streak", description: "30 consecutive days attendance", icon: "💪", category: "streak", threshold: 30 },
    { name: "Task Master", description: "Completed 10 tasks", icon: "📝", category: "achievement", threshold: 10 },
    { name: "Perfect Attendance", description: "No absence in a month", icon: "🎯", category: "achievement", threshold: 0 },
    { name: "Quiz Whiz", description: "Passed 5 quizzes", icon: "🧠", category: "achievement", threshold: 5 },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge,
    });
  }
  console.log("Badges seeded:", badges.length);

  // Create sample agent
  const agentPassword = await bcrypt.hash("agent123", 10);
  const agentUser = await prisma.user.upsert({
    where: { email: "agent@internpro.com" },
    update: {},
    create: { name: "Ravi Agent", email: "agent@internpro.com", phone: "9876500000", password: agentPassword, role: "agent" },
  });

  await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: { userId: agentUser.id, referralCode: "KKHS-RAV-SAMPLE1", commissionRate: 30, totalEarnings: 0, walletBalance: 0 },
  });
  console.log("Sample agent created: agent@internpro.com / agent123");

  // Create sample announcement
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (admin) {
    const existing = await prisma.announcement.findFirst({ where: { title: "Welcome to InternPro!" } });
    if (!existing) {
      await prisma.announcement.create({
        data: { title: "Welcome to InternPro!", content: "Welcome to the KKHS Media internship platform. Complete your tasks, maintain attendance, and earn badges on the leaderboard!", category: "general", isPinned: true, targetRole: "all", authorId: admin.id },
      });
      console.log("Sample announcement created");
    }
  }

  // Add sample testimonials
  const testimonials = [
    { name: "Rahul Sharma", role: "Full Stack Web Development Intern", content: "Amazing experience at KKHS Media! I learned so much about real-world development. The mentorship was incredible and I got placed immediately after completing my internship.", rating: 5, isPublished: true },
    { name: "Priya Gupta", role: "Digital Marketing Intern", content: "The best internship program I have been part of. Live projects, great team, and proper industry exposure. Highly recommended for all students!", rating: 5, isPublished: true },
    { name: "Amit Verma", role: "UI/UX Design Intern", content: "KKHS Media gave me the platform to showcase my skills. Working on real client projects built my portfolio and confidence. Thank you team!", rating: 4, isPublished: true },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { name: t.name } });
    if (!existing) await prisma.testimonial.create({ data: t });
  }
  console.log("Sample testimonials created");

  // Add WhatsApp settings defaults
  const waSettings = [
    { key: "whatsapp_enabled", value: "false" },
    { key: "whatsapp_api_url", value: "" },
    { key: "whatsapp_api_token", value: "" },
  ];
  for (const s of waSettings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log("WhatsApp settings defaults added");
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
