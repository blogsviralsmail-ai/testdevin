// Fix logo in all existing letters and populate default settings
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CORRECT_LOGO = "/uploads/kkhs-logo-new.jpg";

async function main() {
  // 1. Populate default settings if missing
  const defaults = {
    letterhead_logo: CORRECT_LOGO,
    letterhead_company_name: "KKHS Media Private Limited",
    letterhead_address: "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012",
    letterhead_phone: "9782005500",
    letterhead_email: "hari@kkhsmedia.com",
    letterhead_gst: "08AAICK3853C1ZL",
    signatory_name: "Hari Soni",
    signatory_designation: "Managing Director",
  };

  for (const [key, value] of Object.entries(defaults)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.setting.create({ data: { key, value } });
      console.log(`Created setting: ${key} = ${value}`);
    } else {
      console.log(`Setting already exists: ${key} = ${existing.value}`);
    }
  }

  // 2. Fix all offer letters — replace broken logo paths
  const offerLetters = await prisma.offerLetter.findMany();
  for (const ol of offerLetters) {
    if (!ol.htmlContent) continue;
    let html = ol.htmlContent;
    let changed = false;

    // Replace any broken logo paths
    const logoPatterns = [
      /src="\/kkhs-logo\.png"/g,
      /src="\/kkhs-logo-new\.jpg"/g,
      /src="\/uploads\/kkhs-logo\.png"/g,
    ];
    for (const pattern of logoPatterns) {
      if (pattern.test(html)) {
        html = html.replace(pattern, `src="${CORRECT_LOGO}"`);
        changed = true;
      }
    }

    if (changed) {
      await prisma.offerLetter.update({
        where: { id: ol.id },
        data: { htmlContent: html },
      });
      console.log(`Fixed offer letter: ${ol.letterNumber}`);
    } else {
      console.log(`Offer letter OK: ${ol.letterNumber}`);
    }
  }

  // 3. Fix all experience letters — replace broken logo paths
  const expLetters = await prisma.experienceLetter.findMany();
  for (const el of expLetters) {
    if (!el.htmlContent) continue;
    let html = el.htmlContent;
    let changed = false;

    const logoPatterns = [
      /src="\/kkhs-logo\.png"/g,
      /src="\/kkhs-logo-new\.jpg"/g,
      /src="\/uploads\/kkhs-logo\.png"/g,
    ];
    for (const pattern of logoPatterns) {
      if (pattern.test(html)) {
        html = html.replace(pattern, `src="${CORRECT_LOGO}"`);
        changed = true;
      }
    }

    if (changed) {
      await prisma.experienceLetter.update({
        where: { id: el.id },
        data: { htmlContent: html },
      });
      console.log(`Fixed experience letter: ${el.letterNumber}`);
    } else {
      console.log(`Experience letter OK: ${el.letterNumber}`);
    }
  }

  console.log("\nDone! All logos fixed and settings populated.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
