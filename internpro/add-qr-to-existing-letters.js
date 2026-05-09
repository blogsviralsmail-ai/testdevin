// Script to add/update QR codes in all existing offer letters, experience letters, and internship certificates
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SITE_URL = "https://internship.kkhsmedia.com";

function getQrImg(number, size) {
  const verifyUrl = `${SITE_URL}/verify?number=${encodeURIComponent(number)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(verifyUrl)}`;
}

function makeQrBlock(qrImg, w) {
  return `<img src="${qrImg}" alt="Verify QR" style="width:${w}px;height:${w}px;display:inline-block;" /><br/><span style="font-size:9px;color:#888;">Scan to verify</span>`;
}

// Remove any existing QR blocks from HTML
function stripOldQr(html) {
  // Remove QR img tags + "Scan to verify" spans
  html = html.replace(/<img[^>]*alt="Verify QR"[^>]*\/?>(\s*<br\s*\/?>)?\s*(<span[^>]*>Scan to verify<\/span>)?/g, "");
  return html;
}

async function processOfferLetters() {
  const letters = await prisma.offerLetter.findMany({ select: { id: true, letterNumber: true, htmlContent: true } });
  let updated = 0;
  for (const letter of letters) {
    if (!letter.htmlContent) continue;
    const qrImg = getQrImg(letter.letterNumber, 70);
    let html = stripOldQr(letter.htmlContent);

    // Strategy 1: Add QR next to signatory block (wrap "For & on behalf" in table with QR)
    const sigPattern = /For &amp; on behalf of/;
    const sigMatch = html.match(sigPattern);
    if (sigMatch) {
      const sigIdx = html.search(sigPattern);
      // Find the <p> that contains it
      const pStart = html.lastIndexOf("<p", sigIdx);
      // Check if it's already wrapped in a table
      const before = html.substring(Math.max(0, pStart - 100), pStart);
      if (!before.includes("<table") || before.lastIndexOf("</table>") > before.lastIndexOf("<table")) {
        // Not already in a table — find the closing </div> of the signatory div
        const divMarker = html.indexOf('<div style="margin-top:4px;">', sigIdx);
        if (divMarker > -1) {
          let pos = divMarker + '<div style="margin-top:4px;">'.length;
          let depth = 1;
          while (pos < html.length && depth > 0) {
            if (html.substring(pos, pos + 4) === '<div') depth++;
            if (html.substring(pos, pos + 6) === '</div>') { depth--; if (depth === 0) break; }
            pos++;
          }
          const divEnd = pos + 6;
          const sigSection = html.substring(pStart, divEnd);
          const wrapped = `<table style="width:100%;margin-top:5px;"><tr><td style="vertical-align:top;">${sigSection}</td><td style="width:90px;text-align:right;vertical-align:bottom;">${makeQrBlock(qrImg, 70)}</td></tr></table>`;
          html = html.substring(0, pStart) + wrapped + html.substring(divEnd);
        }
      } else {
        // Already in a table — just ensure QR is in the right cell
        // Find the td with text-align:right after the sig table
        const tdRight = html.indexOf('text-align:right;vertical-align:bottom;', sigIdx);
        if (tdRight > -1) {
          const tdStart = html.lastIndexOf("<td", tdRight);
          const tdEnd = html.indexOf("</td>", tdRight);
          if (tdStart > -1 && tdEnd > -1) {
            html = html.substring(0, tdStart) + `<td style="width:90px;text-align:right;vertical-align:bottom;">${makeQrBlock(qrImg, 70)}</td>` + html.substring(tdEnd + 5);
          }
        }
      }
    }

    // Also add QR in acceptance section if not present
    const nameRow = html.match(/<tr><td[^>]*>Name:[^<]*<\/td><td[^>]*>[^<]*<\/td><\/tr>/);
    if (nameRow) {
      const replacement = nameRow[0].replace(
        /(<td[^>]*>Name:[^<]*<\/td>)<td[^>]*>[^<]*<\/td>/,
        `$1<td style="text-align:right;vertical-align:bottom;">${makeQrBlock(qrImg, 60)}</td>`
      );
      html = html.replace(nameRow[0], replacement);
    }

    if (html !== letter.htmlContent) {
      await prisma.offerLetter.update({ where: { id: letter.id }, data: { htmlContent: html } });
      updated++;
      console.log(`  [OK] OL ${letter.letterNumber}`);
    } else {
      console.log(`  [SKIP] OL ${letter.letterNumber}`);
    }
  }
  console.log(`Offer Letters: ${updated}/${letters.length} updated\n`);
}

async function processExperienceLetters() {
  const letters = await prisma.experienceLetter.findMany({ select: { id: true, letterNumber: true, htmlContent: true } });
  let updated = 0;
  for (const letter of letters) {
    if (!letter.htmlContent) continue;
    const qrImg = getQrImg(letter.letterNumber, 70);
    let html = stripOldQr(letter.htmlContent);

    // Find "For & on behalf of" signature section
    const sigPattern = /For &amp; on behalf of/;
    if (sigPattern.test(html)) {
      const sigIdx = html.search(sigPattern);
      const pStart = html.lastIndexOf("<p", sigIdx);
      const before = html.substring(Math.max(0, pStart - 100), pStart);
      if (!before.includes("<table") || before.lastIndexOf("</table>") > before.lastIndexOf("<table")) {
        // Not wrapped yet — find signatory div
        const divMarker = html.indexOf('<div style="margin-top:6px;">', sigIdx);
        if (divMarker > -1) {
          let pos = divMarker + '<div style="margin-top:6px;">'.length;
          let depth = 1;
          while (pos < html.length && depth > 0) {
            if (html.substring(pos, pos + 4) === '<div') depth++;
            if (html.substring(pos, pos + 6) === '</div>') { depth--; if (depth === 0) break; }
            pos++;
          }
          const divEnd = pos + 6;
          const sigSection = html.substring(pStart, divEnd);
          const wrapped = `<table style="width:100%;margin-top:10px;"><tr><td style="vertical-align:top;">${sigSection}</td><td style="width:80px;text-align:right;vertical-align:bottom;">${makeQrBlock(qrImg, 60)}</td></tr></table>`;
          html = html.substring(0, pStart) + wrapped + html.substring(divEnd);
        }
      } else {
        // Already in table — update the QR cell
        const tdRight = html.indexOf('text-align:right;vertical-align:bottom;', sigIdx);
        if (tdRight > -1) {
          const tdStart = html.lastIndexOf("<td", tdRight);
          const tdEnd = html.indexOf("</td>", tdRight);
          if (tdStart > -1 && tdEnd > -1) {
            html = html.substring(0, tdStart) + `<td style="width:80px;text-align:right;vertical-align:bottom;">${makeQrBlock(qrImg, 60)}</td>` + html.substring(tdEnd + 5);
          }
        }
      }
    }

    if (html !== letter.htmlContent) {
      await prisma.experienceLetter.update({ where: { id: letter.id }, data: { htmlContent: html } });
      updated++;
      console.log(`  [OK] EXP ${letter.letterNumber}`);
    } else {
      console.log(`  [SKIP] EXP ${letter.letterNumber}`);
    }
  }
  console.log(`Experience Letters: ${updated}/${letters.length} updated\n`);
}

async function processInternshipCertificates() {
  // Internship certificates are stored as htmlContent in Certificate model
  // They have a star badge that we can replace with QR code
  const certs = await prisma.certificate.findMany({ select: { id: true, certNumber: true } });
  // Certificates don't have htmlContent stored — they're generated on the fly
  // So nothing to update in DB for certificates — the generation code has been updated
  console.log(`Internship Certificates: ${certs.length} found (QR will be added on next generation)`);
}

async function main() {
  console.log("=== Adding/Updating QR codes in existing letters ===\n");
  console.log("Offer Letters:");
  await processOfferLetters();
  console.log("Experience Letters:");
  await processExperienceLetters();
  console.log("Internship Certificates:");
  await processInternshipCertificates();
  console.log("\n=== Done ===");
  await prisma.$disconnect();
}

main().catch(console.error);
