// Script to add QR codes to all existing offer letters and experience letters in the DB
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SITE_URL = "https://internship.kkhsmedia.com";

function getQrImg(letterNumber) {
  const verifyUrl = `${SITE_URL}/verify?number=${encodeURIComponent(letterNumber)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(verifyUrl)}`;
}

async function addQrToOfferLetters() {
  const letters = await prisma.offerLetter.findMany({ select: { id: true, letterNumber: true, htmlContent: true } });
  let updated = 0;
  for (const letter of letters) {
    if (!letter.htmlContent) continue;
    // Skip if QR already added
    if (letter.htmlContent.includes("Verify QR") || letter.htmlContent.includes("Scan to verify")) {
      console.log(`  [SKIP] OL ${letter.letterNumber} - QR already exists`);
      continue;
    }
    const qrImg = getQrImg(letter.letterNumber);

    // For offer letters: add QR in the acceptance section table
    // Pattern: find the last row with "Name: " and add QR to its second cell
    let html = letter.htmlContent;

    // Strategy: Insert QR before the closing </div> of the last page's footer section
    // Look for the intern acceptance table row with Name:
    const nameRowPattern = /<tr><td style="padding:4px 0;">Name:/;
    if (nameRowPattern.test(html)) {
      // Replace the Name row's second <td> to include QR
      html = html.replace(
        /(<tr><td style="padding:4px 0;">Name:[^<]*<\/td>)<td><\/td><\/tr>/,
        `$1<td style="text-align:right;vertical-align:bottom;"><img src="${qrImg}" alt="Verify QR" style="width:60px;height:60px;display:inline-block;" /><br/><span style="font-size:9px;color:#888;">Scan to verify</span></td></tr>`
      );
    } else {
      // Fallback: add QR before the last footer div
      const lastFooterIdx = html.lastIndexOf('<div style="flex-shrink:0;">');
      if (lastFooterIdx > -1) {
        const qrHtml = `<div style="text-align:right;margin-top:5px;padding-right:28px;"><img src="${qrImg}" alt="Verify QR" style="width:60px;height:60px;display:inline-block;" /><br/><span style="font-size:9px;color:#888;">Scan to verify</span></div>`;
        html = html.slice(0, lastFooterIdx) + qrHtml + html.slice(lastFooterIdx);
      }
    }

    if (html !== letter.htmlContent) {
      await prisma.offerLetter.update({ where: { id: letter.id }, data: { htmlContent: html } });
      updated++;
      console.log(`  [OK] OL ${letter.letterNumber} - QR added`);
    } else {
      console.log(`  [SKIP] OL ${letter.letterNumber} - pattern not matched`);
    }
  }
  console.log(`Offer Letters: ${updated}/${letters.length} updated\n`);
}

async function addQrToExperienceLetters() {
  const letters = await prisma.experienceLetter.findMany({ select: { id: true, letterNumber: true, htmlContent: true } });
  let updated = 0;
  for (const letter of letters) {
    if (!letter.htmlContent) continue;
    // Skip if QR already added
    if (letter.htmlContent.includes("Verify QR") || letter.htmlContent.includes("Scan to verify")) {
      console.log(`  [SKIP] EXP ${letter.letterNumber} - QR already exists`);
      continue;
    }
    const qrImg = getQrImg(letter.letterNumber);

    let html = letter.htmlContent;

    // For experience letters: add QR next to the signature block
    // Strategy: Wrap the signature area (For & on behalf of...) in a table with QR on right
    const sigPattern = /<p style="margin:10px 0 0;font-size:14px;color:#333;">For &amp; on behalf of/;
    if (sigPattern.test(html)) {
      // Find the signature section and wrap it
      const sigStart = html.search(sigPattern);
      // Find the closing </div> after the signature block
      let depth = 0;
      let sigDivEnd = -1;
      const afterSig = html.indexOf('<div style="margin-top:6px;">', sigStart);
      if (afterSig > -1) {
        // Find the </div> that closes the margin-top:6px div
        let pos = afterSig + '<div style="margin-top:6px;">'.length;
        depth = 1;
        while (pos < html.length && depth > 0) {
          if (html.substring(pos, pos + 5) === '<div ') depth++;
          if (html.substring(pos, pos + 6) === '</div>') depth--;
          pos++;
        }
        sigDivEnd = pos + 5; // end of </div>
      }

      if (sigDivEnd > -1) {
        const sigSection = html.substring(sigStart, sigDivEnd);
        const replacement = `<table style="width:100%;margin-top:10px;"><tr><td style="vertical-align:top;">${sigSection}</td><td style="width:80px;text-align:right;vertical-align:bottom;"><img src="${qrImg}" alt="Verify QR" style="width:60px;height:60px;display:inline-block;" /><br/><span style="font-size:9px;color:#888;">Scan to verify</span></td></tr></table>`;
        html = html.substring(0, sigStart) + replacement + html.substring(sigDivEnd);
      }
    } else {
      // Fallback: add QR before the last footer div
      const lastFooterIdx = html.lastIndexOf('<div style="flex-shrink:0;">');
      if (lastFooterIdx > -1) {
        const qrHtml = `<div style="text-align:right;margin-top:5px;padding-right:28px;"><img src="${qrImg}" alt="Verify QR" style="width:60px;height:60px;display:inline-block;" /><br/><span style="font-size:9px;color:#888;">Scan to verify</span></div>`;
        html = html.slice(0, lastFooterIdx) + qrHtml + html.slice(lastFooterIdx);
      }
    }

    if (html !== letter.htmlContent) {
      await prisma.experienceLetter.update({ where: { id: letter.id }, data: { htmlContent: html } });
      updated++;
      console.log(`  [OK] EXP ${letter.letterNumber} - QR added`);
    } else {
      console.log(`  [SKIP] EXP ${letter.letterNumber} - pattern not matched`);
    }
  }
  console.log(`Experience Letters: ${updated}/${letters.length} updated\n`);
}

async function main() {
  console.log("=== Adding QR codes to existing letters ===\n");
  console.log("Offer Letters:");
  await addQrToOfferLetters();
  console.log("Experience Letters:");
  await addQrToExperienceLetters();
  console.log("=== Done ===");
  await prisma.$disconnect();
}

main().catch(console.error);
