// Fix logo in all existing letters and populate default settings
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CORRECT_LOGO = "/uploads/kkhs-logo-new.png";

async function main() {
  // 1. Populate default settings (upsert to overwrite stale values too)
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
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    console.log(`Setting: ${key} = ${value}`);
  }

  // Helper: replace all known broken logo paths in HTML
  function fixLogoInHtml(html) {
    const before = html;
    // Match any src attribute pointing to old/broken logo paths
    html = html.replace(/src="\/kkhs-logo\.png"/g, `src="${CORRECT_LOGO}"`);
    html = html.replace(/src="\/kkhs-logo-new\.jpg"/g, `src="${CORRECT_LOGO}"`);
    html = html.replace(/src="\/uploads\/kkhs-logo\.png"/g, `src="${CORRECT_LOGO}"`);
    html = html.replace(/src="\/uploads\/kkhs-logo-new\.jpg"/g, `src="${CORRECT_LOGO}"`);
    return { html, changed: html !== before };
  }

  // 2. Fix all offer letters
  const offerLetters = await prisma.offerLetter.findMany();
  for (const ol of offerLetters) {
    if (!ol.htmlContent) { console.log(`Offer letter ${ol.letterNumber}: no HTML`); continue; }
    const { html, changed } = fixLogoInHtml(ol.htmlContent);
    if (changed) {
      await prisma.offerLetter.update({ where: { id: ol.id }, data: { htmlContent: html } });
      console.log(`Fixed offer letter: ${ol.letterNumber}`);
    } else {
      console.log(`Offer letter OK: ${ol.letterNumber}`);
    }
  }

  // 3. Fix all experience letters
  const expLetters = await prisma.experienceLetter.findMany();
  for (const el of expLetters) {
    if (!el.htmlContent) { console.log(`Experience letter ${el.letterNumber}: no HTML`); continue; }
    const { html, changed } = fixLogoInHtml(el.htmlContent);
    if (changed) {
      await prisma.experienceLetter.update({ where: { id: el.id }, data: { htmlContent: html } });
      console.log(`Fixed experience letter: ${el.letterNumber}`);
    } else {
      console.log(`Experience letter OK: ${el.letterNumber}`);
    }
  }

  // 4. Verify
  const settingsCount = await prisma.setting.count();
  console.log(`\nDone! ${settingsCount} settings in DB. All logos fixed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
