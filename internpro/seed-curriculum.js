// Seed Script: 90-Day Web Dev + 60-Day Digital Marketing Curriculum
// YouTube courses, tasks, quizzes — all day-wise

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting curriculum seed...");

  // Get programs and batches
  const webDevProgram = await prisma.program.findFirst({ where: { domain: "web-dev" } });
  const marketingProgram = await prisma.program.findFirst({ where: { domain: "marketing" } });

  if (!webDevProgram || !marketingProgram) {
    console.error("Programs not found! Run base seed first.");
    process.exit(1);
  }

  // Update totalDays
  await prisma.program.update({ where: { id: webDevProgram.id }, data: { totalDays: 90 } });
  await prisma.program.update({ where: { id: marketingProgram.id }, data: { totalDays: 60 } });

  // Get batches
  const webBatch = await prisma.batch.findFirst({ where: { programId: webDevProgram.id } });
  const mktBatch = await prisma.batch.findFirst({ where: { programId: marketingProgram.id } });

  if (!webBatch) {
    console.error("Web Dev batch not found!");
    process.exit(1);
  }

  // Create marketing batch if not exists
  let marketingBatch = mktBatch;
  if (!marketingBatch) {
    marketingBatch = await prisma.batch.create({
      data: {
        name: "Marketing Batch 2025-A",
        programId: marketingProgram.id,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-08-01"),
        maxStudents: 50,
        isActive: true,
      },
    });
    console.log("Created marketing batch");
  }

  // ===========================
  // WEB DEVELOPMENT — 90 DAYS
  // ===========================
  const webResources = [
    // WEEK 1-2: HTML (Day 1-14)
    { day: 1, title: "Day 1: Introduction to Web Development & VS Code Setup", url: "https://www.youtube.com/watch?v=tVzUXW6siu0", type: "video" },
    { day: 2, title: "Day 2: HTML Basics — Tags, Elements & Structure", url: "https://www.youtube.com/watch?v=k2DSi1zGEc8", type: "video" },
    { day: 3, title: "Day 3: HTML Headings, Paragraphs & Text Formatting", url: "https://www.youtube.com/watch?v=k2DSi1zGEc8&t=700", type: "video" },
    { day: 4, title: "Day 4: HTML Links, Images & Lists", url: "https://www.youtube.com/watch?v=k2DSi1zGEc8&t=1600", type: "video" },
    { day: 5, title: "Day 5: HTML Tables & Forms", url: "https://www.youtube.com/watch?v=k2DSi1zGEc8&t=3400", type: "video" },
    { day: 6, title: "Day 6: HTML5 Semantic Elements & SEO", url: "https://www.youtube.com/watch?v=k2DSi1zGEc8&t=5600", type: "video" },
    { day: 7, title: "Day 7: HTML Practice — Build a Personal Bio Page", url: "https://www.youtube.com/watch?v=k2DSi1zGEc8&t=6900", type: "video" },
    { day: 8, title: "Day 8: HTML Media — Audio, Video & Iframes", url: "https://www.youtube.com/watch?v=BGeDBfCIqas", type: "video" },
    { day: 9, title: "Day 9: HTML Forms Advanced — Validation & Input Types", url: "https://www.youtube.com/watch?v=7KMtvPe7mIc", type: "video" },
    { day: 10, title: "Day 10: Project — Build a Registration Form", url: "https://www.youtube.com/watch?v=E3ByCRqE7Lo", type: "video" },
    { day: 11, title: "Day 11: HTML Meta Tags, Favicon & Best Practices", url: "https://www.youtube.com/watch?v=vOCGnMOUXrs", type: "video" },
    { day: 12, title: "Day 12: Project — Multi-page Website Structure", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=0", type: "video" },
    { day: 13, title: "Day 13: HTML Revision & Quiz Day", url: "https://www.youtube.com/watch?v=k2DSi1zGEc8", type: "video" },
    { day: 14, title: "Day 14: HTML Final Project — Portfolio Page (HTML Only)", url: "https://www.youtube.com/watch?v=k2DSi1zGEc8&t=6900", type: "video" },

    // WEEK 3-5: CSS (Day 15-35)
    { day: 15, title: "Day 15: Introduction to CSS — What, Why & How", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw", type: "video" },
    { day: 16, title: "Day 16: CSS Selectors — ID, Class, Element, Universal", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=500", type: "video" },
    { day: 17, title: "Day 17: CSS Colors, Backgrounds & Gradients", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=3990", type: "video" },
    { day: 18, title: "Day 18: CSS Box Model — Margin, Padding & Borders", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=7240", type: "video" },
    { day: 19, title: "Day 19: CSS Text & Font Properties", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=10160", type: "video" },
    { day: 20, title: "Day 20: CSS Display — Block, Inline, Inline-block, None", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=12560", type: "video" },
    { day: 21, title: "Day 21: CSS Position — Static, Relative, Absolute, Fixed", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=16100", type: "video" },
    { day: 22, title: "Day 22: CSS Flexbox — Complete Guide", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=16560", type: "video" },
    { day: 23, title: "Day 23: CSS Flexbox Practice — Build Layouts", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=17980", type: "video" },
    { day: 24, title: "Day 24: CSS Grid — Complete Guide", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=18420", type: "video" },
    { day: 25, title: "Day 25: CSS Grid Practice — Build Complex Layouts", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=19200", type: "video" },
    { day: 26, title: "Day 26: CSS Media Queries — Responsive Design", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=19800", type: "video" },
    { day: 27, title: "Day 27: CSS Transitions & Animations", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=20480", type: "video" },
    { day: 28, title: "Day 28: CSS Transforms — Rotate, Scale, Skew", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=24460", type: "video" },
    { day: 29, title: "Day 29: CSS Variables & Custom Properties", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=22000", type: "video" },
    { day: 30, title: "Day 30: Project — Responsive Landing Page", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=25750", type: "video" },
    { day: 31, title: "Day 31: CSS Pseudo-classes & Pseudo-elements", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=12100", type: "video" },
    { day: 32, title: "Day 32: CSS Specificity & Cascade Deep Dive", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=5000", type: "video" },
    { day: 33, title: "Day 33: Project — Flipkart Clone (HTML + CSS)", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw&t=25750", type: "video" },
    { day: 34, title: "Day 34: CSS Review & Best Practices", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw", type: "video" },
    { day: 35, title: "Day 35: CSS Quiz & HTML+CSS Assessment Day", url: "https://www.youtube.com/watch?v=Edsxf_NBFrw", type: "video" },

    // WEEK 6-9: JavaScript (Day 36-63)
    { day: 36, title: "Day 36: JavaScript Introduction — What & Why", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg", type: "video" },
    { day: 37, title: "Day 37: JS Variables — var, let, const", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=2400", type: "video" },
    { day: 38, title: "Day 38: JS Data Types & Operators", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=4800", type: "video" },
    { day: 39, title: "Day 39: JS Strings & String Methods", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=7200", type: "video" },
    { day: 40, title: "Day 40: JS Conditional Statements — if, else, switch", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=9600", type: "video" },
    { day: 41, title: "Day 41: JS Loops — for, while, do-while, for..of", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=12000", type: "video" },
    { day: 42, title: "Day 42: JS Functions — Declaration, Expression, Arrow", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=14400", type: "video" },
    { day: 43, title: "Day 43: JS Arrays — Methods & Iteration", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=16800", type: "video" },
    { day: 44, title: "Day 44: JS Objects — Properties, Methods, this", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=19200", type: "video" },
    { day: 45, title: "Day 45: JS DOM — Document Object Model Basics", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=21600", type: "video" },
    { day: 46, title: "Day 46: JS DOM Manipulation — Select, Create, Modify", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=24000", type: "video" },
    { day: 47, title: "Day 47: JS Events — Click, Submit, Keyboard Events", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=26400", type: "video" },
    { day: 48, title: "Day 48: JS Project — Interactive Calculator", url: "https://www.youtube.com/watch?v=cGgLHJGyS34", type: "video" },
    { day: 49, title: "Day 49: JS Higher Order Functions — map, filter, reduce", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=28800", type: "video" },
    { day: 50, title: "Day 50: JS Async — Callbacks, Promises, Async/Await", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=31200", type: "video" },
    { day: 51, title: "Day 51: JS Fetch API — Making HTTP Requests", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=33600", type: "video" },
    { day: 52, title: "Day 52: JS Local Storage & Session Storage", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=36000", type: "video" },
    { day: 53, title: "Day 53: JS Error Handling — Try, Catch, Finally", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=38400", type: "video" },
    { day: 54, title: "Day 54: JS ES6+ Features — Destructuring, Spread, Rest", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=40800", type: "video" },
    { day: 55, title: "Day 55: JS Classes & OOP Basics", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=43200", type: "video" },
    { day: 56, title: "Day 56: JS Modules — Import/Export", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=45600", type: "video" },
    { day: 57, title: "Day 57: Project — Todo List App with LocalStorage", url: "https://www.youtube.com/watch?v=G0jO8kUrg-I", type: "video" },
    { day: 58, title: "Day 58: Project — Weather App using Fetch API", url: "https://www.youtube.com/watch?v=MIYQR-Ybrn4", type: "video" },
    { day: 59, title: "Day 59: JS Regular Expressions", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg&t=48000", type: "video" },
    { day: 60, title: "Day 60: JS Interview Questions & Practice", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg", type: "video" },
    { day: 61, title: "Day 61: JavaScript Quiz Day & Assessment", url: "https://www.youtube.com/watch?v=ER9SspLe4Hg", type: "video" },
    { day: 62, title: "Day 62: Git & GitHub — Version Control Basics", url: "https://www.youtube.com/watch?v=gwWKnnCMQ5c", type: "video" },
    { day: 63, title: "Day 63: Git Branching, Merging & Collaboration", url: "https://www.youtube.com/watch?v=gwWKnnCMQ5c&t=3600", type: "video" },

    // WEEK 10-12: React (Day 64-84)
    { day: 64, title: "Day 64: React Introduction — What, Why & Setup", url: "https://www.youtube.com/watch?v=-mJFZp84TIY", type: "video" },
    { day: 65, title: "Day 65: React Components — Functional Components", url: "https://www.youtube.com/watch?v=hnVOvvbQrwA", type: "video" },
    { day: 66, title: "Day 66: React JSX — Syntax & Rules", url: "https://www.youtube.com/watch?v=-mJFZp84TIY&t=600", type: "video" },
    { day: 67, title: "Day 67: React Props — Passing Data Between Components", url: "https://www.youtube.com/watch?v=KUJsaM-hAjs", type: "video" },
    { day: 68, title: "Day 68: React State — useState Hook", url: "https://www.youtube.com/watch?v=O6P86uwfdR0", type: "video" },
    { day: 69, title: "Day 69: React useEffect Hook — Side Effects", url: "https://www.youtube.com/watch?v=O6P86uwfdR0&t=1800", type: "video" },
    { day: 70, title: "Day 70: React Event Handling & Forms", url: "https://www.youtube.com/watch?v=O6P86uwfdR0&t=3600", type: "video" },
    { day: 71, title: "Day 71: React Conditional Rendering & Lists", url: "https://www.youtube.com/watch?v=O6P86uwfdR0&t=5400", type: "video" },
    { day: 72, title: "Day 72: React Router — Navigation & Routing", url: "https://www.youtube.com/watch?v=VJov5QWEKE4", type: "video" },
    { day: 73, title: "Day 73: React Context API — Global State", url: "https://www.youtube.com/watch?v=VJov5QWEKE4&t=1800", type: "video" },
    { day: 74, title: "Day 74: React Hooks — useRef, useMemo, useCallback", url: "https://www.youtube.com/watch?v=VJov5QWEKE4&t=3600", type: "video" },
    { day: 75, title: "Day 75: React API Integration — Fetch & Axios", url: "https://www.youtube.com/watch?v=VJov5QWEKE4&t=5400", type: "video" },
    { day: 76, title: "Day 76: Project — React News App", url: "https://www.youtube.com/watch?v=VJov5QWEKE4&t=7200", type: "video" },
    { day: 77, title: "Day 77: React Deployment — Build & Deploy to Netlify", url: "https://www.youtube.com/watch?v=VJov5QWEKE4&t=9000", type: "video" },
    { day: 78, title: "Day 78: Node.js Introduction & Setup", url: "https://www.youtube.com/watch?v=BLl32FvcdVM", type: "video" },
    { day: 79, title: "Day 79: Node.js Modules — fs, path, http", url: "https://www.youtube.com/watch?v=BLl32FvcdVM&t=3600", type: "video" },
    { day: 80, title: "Day 80: Express.js — Setting up a Server", url: "https://www.youtube.com/watch?v=BLl32FvcdVM&t=7200", type: "video" },
    { day: 81, title: "Day 81: Express.js Routes, Middleware & REST API", url: "https://www.youtube.com/watch?v=BLl32FvcdVM&t=10800", type: "video" },
    { day: 82, title: "Day 82: MongoDB Introduction & CRUD Operations", url: "https://www.youtube.com/watch?v=J6mDkcqU_ZE", type: "video" },
    { day: 83, title: "Day 83: MongoDB with Express — Mongoose ODM", url: "https://www.youtube.com/watch?v=J6mDkcqU_ZE&t=3600", type: "video" },
    { day: 84, title: "Day 84: Full Stack Project — REST API + React Frontend", url: "https://www.youtube.com/watch?v=52c7Kxp_14E", type: "video" },

    // WEEK 13: Final Project & Review (Day 85-90)
    { day: 85, title: "Day 85: Full Stack Project — User Authentication (JWT)", url: "https://www.youtube.com/watch?v=BLl32FvcdVM&t=14400", type: "video" },
    { day: 86, title: "Day 86: Full Stack Project — Database Design & Models", url: "https://www.youtube.com/watch?v=J6mDkcqU_ZE&t=2400", type: "video" },
    { day: 87, title: "Day 87: Full Stack Project — Frontend Integration", url: "https://www.youtube.com/watch?v=-mJFZp84TIY", type: "video" },
    { day: 88, title: "Day 88: Deployment — Vercel, Render & Railway", url: "https://www.youtube.com/watch?v=BLl32FvcdVM&t=18000", type: "video" },
    { day: 89, title: "Day 89: Portfolio Building & Resume Prep", url: "https://www.youtube.com/watch?v=tVzUXW6siu0", type: "video" },
    { day: 90, title: "Day 90: Final Assessment & Certificate Day", url: "https://www.youtube.com/watch?v=tVzUXW6siu0", type: "video" },
  ];

  // ===========================
  // DIGITAL MARKETING — 60 DAYS
  // ===========================
  const marketingResources = [
    // WEEK 1-2: Digital Marketing Fundamentals (Day 1-14)
    { day: 1, title: "Day 1: Introduction to Digital Marketing", url: "https://www.youtube.com/watch?v=kunkYTKFNtI", type: "video" },
    { day: 2, title: "Day 2: Digital Marketing Channels Overview", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=1800", type: "video" },
    { day: 3, title: "Day 3: Understanding Target Audience & Buyer Persona", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=3600", type: "video" },
    { day: 4, title: "Day 4: Marketing Funnel & Customer Journey", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=5400", type: "video" },
    { day: 5, title: "Day 5: Content Marketing Basics", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=7200", type: "video" },
    { day: 6, title: "Day 6: Content Strategy & Planning", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=9000", type: "video" },
    { day: 7, title: "Day 7: Blogging & Article Writing for Marketing", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=10800", type: "video" },
    { day: 8, title: "Day 8: WordPress Basics for Marketers", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=12600", type: "video" },
    { day: 9, title: "Day 9: Landing Page Design Principles", url: "https://www.youtube.com/watch?v=gfr186Fa5HU", type: "video" },
    { day: 10, title: "Day 10: Email Marketing Fundamentals", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=3600", type: "video" },
    { day: 11, title: "Day 11: Email Marketing Tools — Mailchimp Tutorial", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=5400", type: "video" },
    { day: 12, title: "Day 12: Email Automation & Campaign Setup", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=7200", type: "video" },
    { day: 13, title: "Day 13: AI in Digital Marketing — Tools & Use Cases", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=14400", type: "video" },
    { day: 14, title: "Day 14: Digital Marketing Quiz & Assessment", url: "https://www.youtube.com/watch?v=kunkYTKFNtI", type: "video" },

    // WEEK 3-4: SEO (Day 15-28)
    { day: 15, title: "Day 15: What is SEO & How Search Engines Work", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw", type: "video" },
    { day: 16, title: "Day 16: Keyword Research — Tools & Techniques", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=1800", type: "video" },
    { day: 17, title: "Day 17: On-Page SEO — Title, Meta, Headings, Content", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=3600", type: "video" },
    { day: 18, title: "Day 18: Technical SEO — Site Speed, Mobile, Schema", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=5400", type: "video" },
    { day: 19, title: "Day 19: Off-Page SEO — Backlinks & Link Building", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=7200", type: "video" },
    { day: 20, title: "Day 20: Local SEO — Google My Business", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=9000", type: "video" },
    { day: 21, title: "Day 21: SEO Tools — Google Search Console", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=10800", type: "video" },
    { day: 22, title: "Day 22: SEO Audit — How to Audit a Website", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=12600", type: "video" },
    { day: 23, title: "Day 23: Google Analytics — Setup & Basics", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=14400", type: "video" },
    { day: 24, title: "Day 24: Google Analytics — Reports & Insights", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=16200", type: "video" },
    { day: 25, title: "Day 25: SEO Content Writing — Best Practices", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=18000", type: "video" },
    { day: 26, title: "Day 26: SEO Case Study & Live Website Optimization", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw&t=19800", type: "video" },
    { day: 27, title: "Day 27: SEO with AI Tools — ChatGPT for SEO", url: "https://www.youtube.com/watch?v=CJtE6lbjqO8", type: "video" },
    { day: 28, title: "Day 28: SEO Quiz & Assessment", url: "https://www.youtube.com/watch?v=KSnhfR0M-sw", type: "video" },

    // WEEK 5-6: Social Media Marketing (Day 29-42)
    { day: 29, title: "Day 29: Social Media Marketing Introduction", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=5400", type: "video" },
    { day: 30, title: "Day 30: Facebook Marketing — Page Setup & Strategy", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=9000", type: "video" },
    { day: 31, title: "Day 31: Facebook Ads — Campaign Setup Step by Step", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=10800", type: "video" },
    { day: 32, title: "Day 32: Instagram Marketing — Profile Optimization", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=12600", type: "video" },
    { day: 33, title: "Day 33: Instagram Reels & Content Strategy", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=14400", type: "video" },
    { day: 34, title: "Day 34: LinkedIn Marketing for Professionals", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=16200", type: "video" },
    { day: 35, title: "Day 35: Twitter/X Marketing Strategy", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=7200", type: "video" },
    { day: 36, title: "Day 36: YouTube Marketing & Video SEO", url: "https://www.youtube.com/watch?v=Sevk0gQ1zw4", type: "video" },
    { day: 37, title: "Day 37: YouTube Channel Setup & Optimization", url: "https://www.youtube.com/watch?v=Sevk0gQ1zw4&t=3600", type: "video" },
    { day: 38, title: "Day 38: Social Media Content Calendar & Planning", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=9000", type: "video" },
    { day: 39, title: "Day 39: Social Media Analytics & Reporting", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=10800", type: "video" },
    { day: 40, title: "Day 40: Influencer Marketing Basics", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=18000", type: "video" },
    { day: 41, title: "Day 41: Social Media Automation Tools", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=12600", type: "video" },
    { day: 42, title: "Day 42: Social Media Quiz & Assessment", url: "https://www.youtube.com/watch?v=kunkYTKFNtI", type: "video" },

    // WEEK 7-8: Google Ads & Paid Marketing (Day 43-56)
    { day: 43, title: "Day 43: Google Ads Introduction & Account Setup", url: "https://www.youtube.com/watch?v=Mh-9srK5w54", type: "video" },
    { day: 44, title: "Day 44: Google Search Ads — Campaign Creation", url: "https://www.youtube.com/watch?v=Mh-9srK5w54&t=1800", type: "video" },
    { day: 45, title: "Day 45: Google Search Ads — Keywords & Bidding", url: "https://www.youtube.com/watch?v=Mh-9srK5w54&t=3600", type: "video" },
    { day: 46, title: "Day 46: Google Display Ads — Banner Ads Setup", url: "https://www.youtube.com/watch?v=Mh-9srK5w54&t=5400", type: "video" },
    { day: 47, title: "Day 47: Google Shopping Ads for E-commerce", url: "https://www.youtube.com/watch?v=Mh-9srK5w54&t=7200", type: "video" },
    { day: 48, title: "Day 48: YouTube Ads — Video Campaign Setup", url: "https://www.youtube.com/watch?v=Mh-9srK5w54&t=9000", type: "video" },
    { day: 49, title: "Day 49: Google Ads Optimization & A/B Testing", url: "https://www.youtube.com/watch?v=Mh-9srK5w54&t=10200", type: "video" },
    { day: 50, title: "Day 50: Google Ads Conversion Tracking", url: "https://www.youtube.com/watch?v=Mh-9srK5w54&t=10800", type: "video" },
    { day: 51, title: "Day 51: Facebook & Instagram Ads Manager", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=10800", type: "video" },
    { day: 52, title: "Day 52: Remarketing & Retargeting Strategies", url: "https://www.youtube.com/watch?v=Mh-9srK5w54&t=10200", type: "video" },
    { day: 53, title: "Day 53: PPC Budget Planning & ROI Calculation", url: "https://www.youtube.com/watch?v=Mh-9srK5w54&t=10200", type: "video" },
    { day: 54, title: "Day 54: Landing Page Optimization for Ads", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=3600", type: "video" },
    { day: 55, title: "Day 55: Google Ads Practice & Campaign Setup", url: "https://www.youtube.com/watch?v=Mh-9srK5w54", type: "video" },
    { day: 56, title: "Day 56: Google Ads Quiz & Assessment", url: "https://www.youtube.com/watch?v=Mh-9srK5w54", type: "video" },

    // WEEK 9: Analytics, Reporting & Final (Day 57-60)
    { day: 57, title: "Day 57: Digital Marketing Strategy — Putting It All Together", url: "https://www.youtube.com/watch?v=kunkYTKFNtI&t=14400", type: "video" },
    { day: 58, title: "Day 58: Marketing Portfolio Building", url: "https://www.youtube.com/watch?v=gfr186Fa5HU&t=18000", type: "video" },
    { day: 59, title: "Day 59: Interview Preparation & Resume Tips", url: "https://www.youtube.com/watch?v=kunkYTKFNtI", type: "video" },
    { day: 60, title: "Day 60: Final Assessment & Certificate Day", url: "https://www.youtube.com/watch?v=kunkYTKFNtI", type: "video" },
  ];

  // ===========================
  // TASKS — WEB DEV (Weekly)
  // ===========================
  const webTasks = [
    // Week 1-2: HTML
    { day: 3, title: "HTML: Create a structured webpage", description: "Create a basic HTML page with proper heading hierarchy (h1-h6), paragraphs, links, and an unordered list. Use semantic HTML5 tags like <header>, <main>, <footer>.", maxPoints: 100, type: "assignment" },
    { day: 7, title: "HTML: Build a Personal Bio Page", description: "Build a complete personal bio page with: your photo, name, education details, skills list (ordered), hobbies, and contact form. Must include at least 2 tables and 3 different form input types.", maxPoints: 100, type: "project" },
    { day: 10, title: "HTML: Multi-page Website", description: "Create a 3-page website (Home, About, Contact) with proper navigation links between pages. Include images, tables, and a working contact form.", maxPoints: 100, type: "project" },
    { day: 14, title: "HTML Final Project: Portfolio Page", description: "Build a complete portfolio page using only HTML. Include: header with navigation, about section, skills section with table, projects section, education section, and contact form. Must use HTML5 semantic elements throughout.", maxPoints: 150, type: "project" },

    // Week 3-5: CSS
    { day: 18, title: "CSS: Style Your Portfolio", description: "Take your HTML portfolio and add CSS styling: custom fonts (Google Fonts), color scheme, box model (margins, padding, borders), background colors/gradients.", maxPoints: 100, type: "assignment" },
    { day: 23, title: "CSS: Flexbox Layout Challenge", description: "Create a responsive navigation bar and a 3-column card layout using CSS Flexbox. Cards should have image, title, description, and a button. On mobile, cards should stack vertically.", maxPoints: 100, type: "assignment" },
    { day: 27, title: "CSS: Animations & Transitions", description: "Add CSS animations to your portfolio: hover effects on buttons, fade-in animations on scroll, animated navigation menu, and at least 2 CSS keyframe animations.", maxPoints: 100, type: "assignment" },
    { day: 30, title: "CSS: Responsive Landing Page", description: "Build a complete responsive landing page with: hero section, features grid, testimonials, pricing cards, and footer. Must work perfectly on mobile, tablet, and desktop.", maxPoints: 150, type: "project" },
    { day: 35, title: "CSS Final: Flipkart/Amazon Clone Homepage", description: "Recreate the homepage of Flipkart or Amazon using HTML & CSS. Include: navigation bar, search bar, category slider, product cards grid, and footer. Must be fully responsive.", maxPoints: 200, type: "project" },

    // Week 6-9: JavaScript
    { day: 40, title: "JS: Calculator App", description: "Build a functional calculator that supports +, -, *, /, %. Must have a display screen, number buttons, operator buttons, clear button, and equal button. Style it with CSS.", maxPoints: 100, type: "assignment" },
    { day: 45, title: "JS: DOM Manipulation Quiz App", description: "Build an interactive quiz app: 10 questions, 4 options each, show score at end, highlight correct/wrong answers, timer for each question (30 sec). Use DOM manipulation only.", maxPoints: 150, type: "project" },
    { day: 50, title: "JS: Weather App with API", description: "Build a weather app using OpenWeatherMap API (free). User enters city name, app shows: temperature, humidity, wind speed, weather icon, and 5-day forecast.", maxPoints: 150, type: "project" },
    { day: 57, title: "JS: Todo List with LocalStorage", description: "Build a complete Todo List app: add/edit/delete tasks, mark as complete, filter (all/active/completed), data persists in LocalStorage, responsive design.", maxPoints: 150, type: "project" },
    { day: 61, title: "JavaScript Assessment", description: "Complete the JavaScript assessment. Solve 5 coding challenges: array manipulation, DOM exercise, async/await fetch, object-oriented design, and a mini game (snake/memory).", maxPoints: 200, type: "assessment" },

    // Week 10-12: React
    { day: 68, title: "React: Components & Props Practice", description: "Create a product card component that accepts props (image, name, price, rating). Render a list of 6 products using this component. Add filter by price range.", maxPoints: 100, type: "assignment" },
    { day: 72, title: "React: Blog App with Router", description: "Build a blog app with React Router: Home page (list posts), Post detail page, About page, Contact page. Use useState and useEffect to fetch blog data from JSONPlaceholder API.", maxPoints: 150, type: "project" },
    { day: 76, title: "React: News App with API", description: "Build a news app that fetches real news from NewsAPI. Features: category filter, search, pagination, responsive grid layout, loading states, error handling.", maxPoints: 150, type: "project" },

    // Week 13: Backend + Final
    { day: 81, title: "Express: REST API", description: "Build a REST API with Express.js: CRUD operations for a 'Products' collection. Endpoints: GET /products, GET /products/:id, POST /products, PUT /products/:id, DELETE /products/:id. Add validation and error handling.", maxPoints: 150, type: "project" },
    { day: 84, title: "Full Stack: MERN App", description: "Build a complete MERN (MongoDB, Express, React, Node) application: a Task Manager with user authentication (JWT), task CRUD, assign tasks, and dashboard.", maxPoints: 200, type: "project" },
    { day: 90, title: "Final Capstone Project", description: "Build and deploy a complete full-stack web application of your choice. Must include: responsive frontend (React), REST API (Express), database (MongoDB/SQL), authentication, deployment on Vercel/Render. Submit live URL + GitHub repo link.", maxPoints: 300, type: "project" },
  ];

  // ===========================
  // TASKS — DIGITAL MARKETING (Weekly)
  // ===========================
  const marketingTasks = [
    // Week 1-2: Fundamentals
    { day: 5, title: "Content Strategy Document", description: "Create a complete content strategy for a hypothetical brand: define target audience, buyer personas (3), content pillars (5), content calendar for 1 month, and distribution channels.", maxPoints: 100, type: "assignment" },
    { day: 10, title: "Email Campaign Setup", description: "Set up a free Mailchimp account and create a complete email campaign: welcome email sequence (3 emails), design email template, set up a landing page with signup form.", maxPoints: 100, type: "assignment" },
    { day: 14, title: "Digital Marketing Plan", description: "Create a comprehensive digital marketing plan for a small business: market analysis, competitor analysis, SWOT analysis, marketing objectives, channel strategy, budget allocation, and KPIs.", maxPoints: 150, type: "project" },

    // Week 3-4: SEO
    { day: 18, title: "Keyword Research Report", description: "Conduct keyword research for a niche (choose any): find 50 keywords using Google Keyword Planner/Ubersuggest, categorize by intent (informational/commercial/transactional), analyze competition, and create a keyword strategy document.", maxPoints: 100, type: "assignment" },
    { day: 22, title: "SEO Audit Report", description: "Perform a complete SEO audit of any website (with permission or public site): technical SEO check, on-page analysis, content audit, backlink profile, speed test. Create a detailed report with recommendations.", maxPoints: 150, type: "project" },
    { day: 28, title: "SEO Optimized Blog Post", description: "Write a 1500+ word SEO-optimized blog post on any topic: proper H1-H6 structure, meta title & description, keyword density, internal/external links, images with alt tags, and schema markup suggestions.", maxPoints: 100, type: "assignment" },

    // Week 5-6: Social Media
    { day: 33, title: "Social Media Content Creation", description: "Create 10 social media posts (mix of images, carousels, reels scripts) for a brand: 3 for Instagram, 3 for Facebook, 2 for LinkedIn, 2 for Twitter. Include captions, hashtags, and posting schedule.", maxPoints: 100, type: "assignment" },
    { day: 38, title: "Social Media Strategy", description: "Create a 30-day social media strategy for a brand: platform selection, content themes, posting frequency, engagement tactics, hashtag strategy, influencer collaboration plan, and KPIs to track.", maxPoints: 150, type: "project" },
    { day: 42, title: "Social Media Analytics Report", description: "Analyze any brand's social media presence (minimum 2 platforms). Create a report covering: follower growth, engagement rate, best performing content, posting patterns, audience demographics, and improvement suggestions.", maxPoints: 100, type: "assignment" },

    // Week 7-8: Google Ads
    { day: 46, title: "Google Search Ads Campaign Plan", description: "Create a Google Search Ads campaign plan: select business, define goals, keyword groups (3 ad groups, 10 keywords each), write ad copies (3 variations), set budget, define bidding strategy, and tracking setup.", maxPoints: 150, type: "project" },
    { day: 50, title: "Display & Video Ad Campaign", description: "Plan a Google Display + YouTube Video ad campaign: define target audience, create ad creatives (mockups), set targeting options (demographics, interests, placements), budget allocation, and expected metrics.", maxPoints: 100, type: "assignment" },
    { day: 56, title: "PPC Campaign Report", description: "Create a comprehensive PPC report template: campaign performance metrics, keyword performance, ad copy performance, cost analysis, conversion tracking, A/B test results, and optimization recommendations.", maxPoints: 150, type: "project" },

    // Week 9: Final
    { day: 58, title: "Digital Marketing Portfolio", description: "Create a professional digital marketing portfolio: showcase all your work from the internship — content strategies, SEO audits, social media campaigns, ad plans. Include metrics and results where possible.", maxPoints: 200, type: "project" },
    { day: 60, title: "Final Capstone: Complete Marketing Strategy", description: "Create a complete integrated digital marketing strategy for a real business: SEO plan, content strategy, social media calendar, email sequences, Google Ads plan, analytics setup, budget, and 90-day growth roadmap. Present as a professional pitch deck.", maxPoints: 300, type: "project" },
  ];

  // ===========================
  // QUIZZES — WEB DEV
  // ===========================
  const webQuizzes = [
    {
      title: "HTML Fundamentals Quiz",
      description: "Test your knowledge of HTML tags, attributes, forms, and semantic elements.",
      passingScore: 60,
      timeLimit: 15,
      questions: [
        { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correct: 0 },
        { q: "Which tag is used for the largest heading?", options: ["<heading>", "<h6>", "<h1>", "<head>"], correct: 2 },
        { q: "Which HTML element is used to define an unordered list?", options: ["<ol>", "<ul>", "<li>", "<list>"], correct: 1 },
        { q: "What is the correct HTML for creating a hyperlink?", options: ["<a url='url'>", "<a href='url'>", "<link href='url'>", "<hyperlink>"], correct: 1 },
        { q: "Which HTML attribute specifies an alternate text for an image?", options: ["title", "src", "alt", "longdesc"], correct: 2 },
        { q: "Which HTML tag is used for line break?", options: ["<break>", "<lb>", "<br>", "<newline>"], correct: 2 },
        { q: "What is the correct HTML for inserting an image?", options: ["<img href='image.gif'>", "<img src='image.gif'>", "<image src='image.gif'>", "<img link='image.gif'>"], correct: 1 },
        { q: "Which HTML element defines the title of a document?", options: ["<meta>", "<head>", "<title>", "<header>"], correct: 2 },
        { q: "Which input type is used for password fields?", options: ["textbox", "secret", "password", "hidden"], correct: 2 },
        { q: "What is the purpose of the <DOCTYPE> declaration?", options: ["Define the document title", "Link CSS files", "Specify the HTML version", "Create a div element"], correct: 2 },
      ],
    },
    {
      title: "CSS Mastery Quiz",
      description: "Test your CSS knowledge — selectors, box model, flexbox, grid, and responsive design.",
      passingScore: 60,
      timeLimit: 20,
      questions: [
        { q: "Which CSS property is used to change the text color?", options: ["font-color", "text-color", "color", "foreground-color"], correct: 2 },
        { q: "Which property is used to change the background color?", options: ["bgcolor", "background-color", "color", "background"], correct: 1 },
        { q: "How do you select an element with id 'demo'?", options: [".demo", "#demo", "demo", "*demo"], correct: 1 },
        { q: "Which CSS property controls the text size?", options: ["text-size", "font-size", "text-style", "font-style"], correct: 1 },
        { q: "What is the default value of the position property?", options: ["relative", "absolute", "fixed", "static"], correct: 3 },
        { q: "Which display value makes an element a flex container?", options: ["display: block", "display: flex", "display: inline", "display: grid"], correct: 1 },
        { q: "How do you make text bold in CSS?", options: ["font-weight: bold", "text-style: bold", "font: bold", "text-weight: bold"], correct: 0 },
        { q: "Which CSS property is used for adding space inside an element?", options: ["margin", "padding", "border", "spacing"], correct: 1 },
        { q: "What does 'z-index' control?", options: ["Font size", "Element width", "Stack order of elements", "Element opacity"], correct: 2 },
        { q: "Which media query targets screens less than 768px?", options: ["@media (min-width: 768px)", "@media (max-width: 768px)", "@media screen(768px)", "@media (width < 768)"], correct: 1 },
      ],
    },
    {
      title: "JavaScript Essentials Quiz",
      description: "Test your JavaScript knowledge — variables, functions, DOM, arrays, and async programming.",
      passingScore: 60,
      timeLimit: 25,
      questions: [
        { q: "Which keyword declares a constant in JavaScript?", options: ["var", "let", "const", "final"], correct: 2 },
        { q: "What does typeof null return?", options: ["null", "undefined", "object", "boolean"], correct: 2 },
        { q: "Which method adds an element to the end of an array?", options: ["push()", "append()", "add()", "insert()"], correct: 0 },
        { q: "What is the output of '2' + 2 in JavaScript?", options: ["4", "22", "NaN", "Error"], correct: 1 },
        { q: "Which method selects an element by ID?", options: ["getElement()", "getElementById()", "querySelector()", "findById()"], correct: 1 },
        { q: "What does JSON.parse() do?", options: ["Converts JSON to string", "Converts string to JSON", "Validates JSON", "Deletes JSON"], correct: 1 },
        { q: "What is a closure in JavaScript?", options: ["A function inside a loop", "A function with access to outer scope", "A class method", "An array method"], correct: 1 },
        { q: "Which keyword is used for async error handling?", options: ["catch", "error", "try-catch", "handle"], correct: 2 },
        { q: "What does the spread operator (...) do?", options: ["Multiplies values", "Expands iterable elements", "Creates a loop", "Declares variables"], correct: 1 },
        { q: "What is the event loop in JavaScript?", options: ["A for loop for events", "Mechanism to handle async operations", "DOM event handler", "Array iteration method"], correct: 1 },
      ],
    },
    {
      title: "React Fundamentals Quiz",
      description: "Test your React knowledge — components, hooks, state management, and routing.",
      passingScore: 60,
      timeLimit: 20,
      questions: [
        { q: "What is React?", options: ["A backend framework", "A JavaScript library for UIs", "A CSS framework", "A database"], correct: 1 },
        { q: "What hook is used for state in functional components?", options: ["useEffect", "useState", "useContext", "useReducer"], correct: 1 },
        { q: "What is JSX?", options: ["A new programming language", "JavaScript XML — syntax extension", "A CSS preprocessor", "A testing framework"], correct: 1 },
        { q: "How do you pass data from parent to child?", options: ["Context", "State", "Props", "Redux"], correct: 2 },
        { q: "What does useEffect do?", options: ["Manages state", "Handles side effects", "Creates components", "Handles routing"], correct: 1 },
        { q: "Which package handles routing in React?", options: ["react-navigate", "react-router-dom", "react-routing", "react-links"], correct: 1 },
        { q: "What is the Virtual DOM?", options: ["The browser DOM", "A copy of the real DOM in memory", "A CSS rendering engine", "A Node.js module"], correct: 1 },
        { q: "How do you conditionally render in React?", options: ["if-else in JSX", "Ternary operator or &&", "switch statement", "for loop"], correct: 1 },
        { q: "What is the key prop used for?", options: ["Styling elements", "Uniquely identifying list items", "API authentication", "Event handling"], correct: 1 },
        { q: "What does React.memo() do?", options: ["Creates a memo component", "Memoizes component to prevent re-renders", "Saves state", "Handles errors"], correct: 1 },
      ],
    },
  ];

  // ===========================
  // QUIZZES — DIGITAL MARKETING
  // ===========================
  const marketingQuizzes = [
    {
      title: "Digital Marketing Fundamentals Quiz",
      description: "Test your knowledge of digital marketing basics, channels, and strategy.",
      passingScore: 60,
      timeLimit: 15,
      questions: [
        { q: "What is Digital Marketing?", options: ["Marketing using print media", "Marketing using digital channels", "Door-to-door marketing", "TV advertising only"], correct: 1 },
        { q: "Which is NOT a digital marketing channel?", options: ["SEO", "Billboard advertising", "Email Marketing", "Social Media"], correct: 1 },
        { q: "What is a 'buyer persona'?", options: ["A real customer profile", "A fictional ideal customer representation", "A sales technique", "A pricing strategy"], correct: 1 },
        { q: "What does CTR stand for?", options: ["Click Through Rate", "Customer Tracking Result", "Content Traffic Report", "Cost To Reach"], correct: 0 },
        { q: "What is a marketing funnel?", options: ["A kitchen tool", "Customer journey from awareness to purchase", "A social media filter", "An ad format"], correct: 1 },
        { q: "Which metric measures brand awareness?", options: ["Conversion rate", "Impressions & Reach", "Cart abandonment", "Customer lifetime value"], correct: 1 },
        { q: "What is Content Marketing?", options: ["Paying for ads", "Creating valuable content to attract customers", "Buying email lists", "Cold calling"], correct: 1 },
        { q: "What does ROI stand for?", options: ["Return on Investment", "Rate of Interest", "Reach of Impressions", "Revenue on Inventory"], correct: 0 },
        { q: "What is A/B Testing?", options: ["Testing two ad networks", "Comparing two versions to see which performs better", "Testing ads on Android vs iOS", "Alphabetical ad sorting"], correct: 1 },
        { q: "Which is the most used search engine?", options: ["Bing", "Yahoo", "Google", "DuckDuckGo"], correct: 2 },
      ],
    },
    {
      title: "SEO Knowledge Quiz",
      description: "Test your SEO knowledge — on-page, off-page, technical SEO, and analytics.",
      passingScore: 60,
      timeLimit: 20,
      questions: [
        { q: "What does SEO stand for?", options: ["Search Engine Optimization", "Social Engine Optimization", "Search Engine Organization", "Site Engine Optimization"], correct: 0 },
        { q: "Which is an on-page SEO factor?", options: ["Backlinks", "Social shares", "Meta title & description", "Domain age"], correct: 2 },
        { q: "What is a backlink?", options: ["A link on your website", "A link from another website to yours", "A broken link", "A redirect link"], correct: 1 },
        { q: "Which tool is used for keyword research?", options: ["Photoshop", "Google Keyword Planner", "Mailchimp", "Canva"], correct: 1 },
        { q: "What is 'crawling' in SEO?", options: ["Manual website review", "Search engine bots scanning your website", "User browsing behavior", "Speed testing"], correct: 1 },
        { q: "What is a 301 redirect?", options: ["Temporary redirect", "Permanent redirect", "Error page", "Login redirect"], correct: 1 },
        { q: "Which HTML tag is most important for SEO?", options: ["<div>", "<span>", "<title>", "<style>"], correct: 2 },
        { q: "What is 'bounce rate'?", options: ["Email bounce rate", "Percentage of visitors who leave after viewing one page", "Server error rate", "Ad click rate"], correct: 1 },
        { q: "What is Local SEO?", options: ["SEO for local businesses to appear in local searches", "SEO for local networks", "SEO for local files", "SEO for local languages only"], correct: 0 },
        { q: "What is the ideal page load time for SEO?", options: ["Under 10 seconds", "Under 3 seconds", "Under 30 seconds", "Speed doesn't matter"], correct: 1 },
      ],
    },
    {
      title: "Social Media Marketing Quiz",
      description: "Test your knowledge of social media marketing strategies and platforms.",
      passingScore: 60,
      timeLimit: 15,
      questions: [
        { q: "Which platform is best for B2B marketing?", options: ["Instagram", "TikTok", "LinkedIn", "Snapchat"], correct: 2 },
        { q: "What is 'engagement rate'?", options: ["Number of followers", "Interactions divided by impressions/followers", "Number of posts", "Ad spend"], correct: 1 },
        { q: "What is the best time to post on Instagram (India)?", options: ["2 AM", "9 AM - 11 AM or 7 PM - 9 PM", "3 PM", "Midnight"], correct: 1 },
        { q: "What are 'hashtags' used for?", options: ["Encryption", "Content categorization and discoverability", "Payment processing", "User authentication"], correct: 1 },
        { q: "What is influencer marketing?", options: ["Marketing to influence stock prices", "Partnering with social media personalities for promotion", "Influencing search algorithms", "Government marketing"], correct: 1 },
        { q: "What is a content calendar?", options: ["A physical calendar", "A schedule for planning social media posts", "A Google Calendar feature", "An email scheduler"], correct: 1 },
        { q: "Which metric shows how many people saw your post?", options: ["Clicks", "Reach/Impressions", "Comments", "Shares"], correct: 1 },
        { q: "What is 'organic reach'?", options: ["Paid visibility", "Free visibility without ads", "Reach of organic food brands", "Viral content only"], correct: 1 },
        { q: "What is the maximum Instagram Reel duration?", options: ["15 seconds", "30 seconds", "90 seconds", "10 minutes"], correct: 2 },
        { q: "What does 'UGC' stand for?", options: ["User Generated Content", "Universal Graphics Creator", "Unified Growth Channel", "User Guided Campaign"], correct: 0 },
      ],
    },
    {
      title: "Google Ads & PPC Quiz",
      description: "Test your knowledge of Google Ads, PPC advertising, and campaign management.",
      passingScore: 60,
      timeLimit: 20,
      questions: [
        { q: "What does PPC stand for?", options: ["Pay Per Click", "Pay Per Customer", "Price Per Campaign", "Post Per Channel"], correct: 0 },
        { q: "Which Google Ads campaign type shows text ads in search results?", options: ["Display", "Video", "Search", "Shopping"], correct: 2 },
        { q: "What is Quality Score in Google Ads?", options: ["Ad budget", "Google's rating of ad relevance and quality", "Number of clicks", "Customer review score"], correct: 1 },
        { q: "What is CPC?", options: ["Cost Per Conversion", "Cost Per Click", "Customer Per Campaign", "Click Per Customer"], correct: 1 },
        { q: "What is remarketing?", options: ["Marketing again after failure", "Showing ads to people who visited your website", "Rebranding", "Market research"], correct: 1 },
        { q: "What is a negative keyword?", options: ["A keyword with low search volume", "A keyword you exclude from your campaign", "A misspelled keyword", "A competitor keyword"], correct: 1 },
        { q: "Which bidding strategy maximizes clicks?", options: ["Target CPA", "Maximize Clicks", "Target ROAS", "Manual CPC"], correct: 1 },
        { q: "What is CTR (Click-Through Rate)?", options: ["Clicks / Budget", "Clicks / Impressions x 100", "Impressions / Clicks", "Cost / Clicks"], correct: 1 },
        { q: "What is conversion tracking?", options: ["Tracking user conversions/actions after clicking an ad", "Tracking ad impressions", "Tracking website speed", "Tracking competitors"], correct: 0 },
        { q: "Which ad extension shows your phone number?", options: ["Sitelink", "Callout", "Call extension", "Location"], correct: 2 },
      ],
    },
  ];

  // ===========================
  // SEED RESOURCES
  // ===========================
  console.log("📹 Seeding Web Dev resources...");
  let webResourceCount = 0;
  for (const r of webResources) {
    await prisma.resource.upsert({
      where: { id: `webdev-day${r.day}` },
      create: {
        id: `webdev-day${r.day}`,
        batchId: webBatch.id,
        title: r.title,
        type: r.type,
        url: r.url,
        dayNumber: r.day,
        order: r.day,
        isPublished: true,
      },
      update: {
        title: r.title,
        url: r.url,
        dayNumber: r.day,
      },
    });
    webResourceCount++;
  }
  console.log(`  ✅ ${webResourceCount} Web Dev resources seeded`);

  console.log("📹 Seeding Marketing resources...");
  let mktResourceCount = 0;
  for (const r of marketingResources) {
    await prisma.resource.upsert({
      where: { id: `mkt-day${r.day}` },
      create: {
        id: `mkt-day${r.day}`,
        batchId: marketingBatch.id,
        title: r.title,
        type: r.type,
        url: r.url,
        dayNumber: r.day,
        order: r.day,
        isPublished: true,
      },
      update: {
        title: r.title,
        url: r.url,
        dayNumber: r.day,
      },
    });
    mktResourceCount++;
  }
  console.log(`  ✅ ${mktResourceCount} Marketing resources seeded`);

  // ===========================
  // SEED TASKS
  // ===========================
  console.log("📝 Seeding Web Dev tasks...");
  let webTaskCount = 0;
  for (const t of webTasks) {
    await prisma.task.upsert({
      where: { id: `webdev-task-day${t.day}` },
      create: {
        id: `webdev-task-day${t.day}`,
        batchId: webBatch.id,
        title: t.title,
        description: t.description,
        type: t.type,
        dayNumber: t.day,
        maxPoints: t.maxPoints,
        isPublished: true,
        order: t.day,
      },
      update: {
        title: t.title,
        description: t.description,
        maxPoints: t.maxPoints,
      },
    });
    webTaskCount++;
  }
  console.log(`  ✅ ${webTaskCount} Web Dev tasks seeded`);

  console.log("📝 Seeding Marketing tasks...");
  let mktTaskCount = 0;
  for (const t of marketingTasks) {
    await prisma.task.upsert({
      where: { id: `mkt-task-day${t.day}` },
      create: {
        id: `mkt-task-day${t.day}`,
        batchId: marketingBatch.id,
        title: t.title,
        description: t.description,
        type: t.type,
        dayNumber: t.day,
        maxPoints: t.maxPoints,
        isPublished: true,
        order: t.day,
      },
      update: {
        title: t.title,
        description: t.description,
        maxPoints: t.maxPoints,
      },
    });
    mktTaskCount++;
  }
  console.log(`  ✅ ${mktTaskCount} Marketing tasks seeded`);

  // ===========================
  // SEED QUIZZES
  // ===========================
  // Get admin user for createdBy
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  const createdBy = admin ? admin.id : "system";

  console.log("🧠 Seeding Web Dev quizzes...");
  for (const quiz of webQuizzes) {
    const existing = await prisma.quiz.findFirst({ where: { title: quiz.title, programId: webDevProgram.id } });
    if (existing) {
      console.log(`  ⏭ Quiz "${quiz.title}" already exists, skipping`);
      continue;
    }
    const created = await prisma.quiz.create({
      data: {
        title: quiz.title,
        description: quiz.description,
        programId: webDevProgram.id,
        batchId: webBatch.id,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        isPublished: true,
        createdBy,
        questions: {
          create: quiz.questions.map((q, i) => ({
            question: q.q,
            type: "multiple_choice",
            options: JSON.stringify(q.options),
            correctAnswer: String(q.correct),
            points: 10,
            order: i + 1,
          })),
        },
      },
    });
    console.log(`  ✅ Quiz "${created.title}" created with ${quiz.questions.length} questions`);
  }

  console.log("🧠 Seeding Marketing quizzes...");
  for (const quiz of marketingQuizzes) {
    const existing = await prisma.quiz.findFirst({ where: { title: quiz.title, programId: marketingProgram.id } });
    if (existing) {
      console.log(`  ⏭ Quiz "${quiz.title}" already exists, skipping`);
      continue;
    }
    const created = await prisma.quiz.create({
      data: {
        title: quiz.title,
        description: quiz.description,
        programId: marketingProgram.id,
        batchId: marketingBatch.id,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        isPublished: true,
        createdBy,
        questions: {
          create: quiz.questions.map((q, i) => ({
            question: q.q,
            type: "multiple_choice",
            options: JSON.stringify(q.options),
            correctAnswer: String(q.correct),
            points: 10,
            order: i + 1,
          })),
        },
      },
    });
    console.log(`  ✅ Quiz "${created.title}" created with ${quiz.questions.length} questions`);
  }

  // ===========================
  // SUMMARY
  // ===========================
  console.log("\n🎉 CURRICULUM SEEDING COMPLETE!");
  console.log("================================");
  console.log(`📹 Web Dev Resources: ${webResourceCount} (Day 1-90)`);
  console.log(`📹 Marketing Resources: ${mktResourceCount} (Day 1-60)`);
  console.log(`📝 Web Dev Tasks: ${webTaskCount}`);
  console.log(`📝 Marketing Tasks: ${mktTaskCount}`);
  console.log(`🧠 Web Dev Quizzes: ${webQuizzes.length} (${webQuizzes.reduce((a, q) => a + q.questions.length, 0)} questions)`);
  console.log(`🧠 Marketing Quizzes: ${marketingQuizzes.length} (${marketingQuizzes.reduce((a, q) => a + q.questions.length, 0)} questions)`);
  console.log("================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
