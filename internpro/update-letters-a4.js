// Script to update existing offer letters and experience letters to new A4 design
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Update offer letters: replace old page styling with A4 page styling
  const offerLetters = await prisma.offerLetter.findMany();
  console.log(`Found ${offerLetters.length} offer letters to update`);

  for (const letter of offerLetters) {
    if (!letter.htmlContent) continue;
    let html = letter.htmlContent;
    
    // Replace old wrapper with A4 wrapper
    html = html.replace(
      /max-width:\s*800px;/g,
      ""
    );
    
    // Replace old @page style
    html = html.replace(
      /@page\s*\{\s*margin:\s*10mm\s+0;\s*\}/g,
      "@page { size: A4; margin: 0; }"
    );
    
    // Add A4 page classes if not present
    if (!html.includes(".a4-page")) {
      html = html.replace(
        /<style>@page/,
        `<style>
  @page { size: A4; margin: 0; }
  @media print { .no-print { display: none !important; } }
  .a4-page { width: 210mm; min-height: 297mm; padding: 0; margin: 0 auto; background: white; position: relative; box-sizing: border-box; page-break-after: always; display: flex; flex-direction: column; }
  .a4-page:last-child { page-break-after: auto; }
  .page-content { flex: 1; padding: 20px 36px 10px; }
  .page-footer { flex-shrink: 0; }
</style><style_replaced>@page`
      );
    }
    
    await prisma.offerLetter.update({
      where: { id: letter.id },
      data: { htmlContent: html },
    });
    console.log(`Updated offer letter ${letter.letterNumber}`);
  }

  // Update experience letters
  const expLetters = await prisma.experienceLetter.findMany();
  console.log(`Found ${expLetters.length} experience letters to update`);

  for (const letter of expLetters) {
    if (!letter.htmlContent) continue;
    let html = letter.htmlContent;
    
    html = html.replace(
      /max-width:\s*800px;/g,
      ""
    );
    
    html = html.replace(
      /@page\s*\{\s*margin:\s*10mm\s+0;\s*\}/g,
      "@page { size: A4; margin: 0; }"
    );
    
    if (!html.includes(".a4-page")) {
      // Wrap content in A4 page div
      html = html.replace(
        '<style>@page',
        `<style>
  @page { size: A4; margin: 0; }
  @media print { .no-print { display: none !important; } }
  .a4-page { width: 210mm; min-height: 297mm; padding: 0; margin: 0 auto; background: white; position: relative; box-sizing: border-box; display: flex; flex-direction: column; }
  .page-content { flex: 1; padding: 18px 36px 10px; }
  .page-footer { flex-shrink: 0; }
</style><style_replaced>@page`
      );
    }
    
    await prisma.experienceLetter.update({
      where: { id: letter.id },
      data: { htmlContent: html },
    });
    console.log(`Updated experience letter ${letter.letterNumber}`);
  }

  console.log("All letters updated to A4 format!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
