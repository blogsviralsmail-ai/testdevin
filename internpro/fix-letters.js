// Fix the broken <style> and <style_replaced> tags in existing letters
// Remove all <style>...</style> blocks from htmlContent since they render as text
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Fix offer letters - remove <style>...</style> blocks and class-based divs
  const offerLetters = await prisma.offerLetter.findMany();
  console.log(`Found ${offerLetters.length} offer letters`);
  for (const letter of offerLetters) {
    if (!letter.htmlContent) continue;
    let html = letter.htmlContent;
    
    // Remove all <style>...</style> blocks (including <style_replaced>)
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    
    // Replace class-based divs with inline styles
    html = html.replace(/class="a4-page"/g, 'style="width: 210mm; min-height: 297mm; padding: 0; margin: 0 auto; background: white; position: relative; box-sizing: border-box; page-break-after: always; display: flex; flex-direction: column;"');
    html = html.replace(/class="page-content"/g, 'style="flex: 1; padding: 16px 32px 8px;"');
    html = html.replace(/class="page-footer"/g, 'style="flex-shrink: 0;"');
    
    if (html !== letter.htmlContent) {
      // Fix the last a4-page to not have page-break-after
      // Find the last occurrence of the a4-page inline style and remove page-break-after
      const lastIdx = html.lastIndexOf('page-break-after: always;');
      if (lastIdx > -1) {
        html = html.substring(0, lastIdx) + html.substring(lastIdx).replace('page-break-after: always;', '');
      }
      
      await prisma.offerLetter.update({
        where: { id: letter.id },
        data: { htmlContent: html },
      });
      console.log(`Fixed offer letter ${letter.letterNumber}`);
    }
  }

  // Fix experience letters
  const expLetters = await prisma.experienceLetter.findMany();
  console.log(`Found ${expLetters.length} experience letters`);
  for (const letter of expLetters) {
    if (!letter.htmlContent) continue;
    let html = letter.htmlContent;
    
    // Remove all <style>...</style> blocks
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    
    // Replace class-based divs with inline styles
    html = html.replace(/class="a4-page"/g, 'style="width: 210mm; min-height: 297mm; padding: 0; margin: 0 auto; background: white; position: relative; box-sizing: border-box; display: flex; flex-direction: column;"');
    html = html.replace(/class="page-content"/g, 'style="flex: 1; padding: 14px 32px 8px;"');
    html = html.replace(/class="page-footer"/g, 'style="flex-shrink: 0;"');
    
    if (html !== letter.htmlContent) {
      await prisma.experienceLetter.update({
        where: { id: letter.id },
        data: { htmlContent: html },
      });
      console.log(`Fixed experience letter ${letter.letterNumber}`);
    }
  }

  console.log("All letters fixed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
