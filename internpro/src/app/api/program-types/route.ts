import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Default program types — used when settings are not configured
const defaultPrograms = [
  {
    id: "premium_paid_training",
    title: "Premium Paid Training Program",
    fees: "₹5,000",
    feesNote: "3 Months",
    duration: "3 Months",
    mode: "Online",
    modeIcon: "laptop",
    image: "",
    color: "#4f46e5",
    idealFor: "2nd & 3rd year students who want serious learning, strong portfolio and job readiness",
    highlights: [
      "Complete structured online training",
      "Real-time projects on Live Client Work / Industry Projects",
      "Weekly doubt sessions with mentors",
      "Final project report + presentation",
      "Certificate + Experience Letter + Recommendation Letter",
      "Best for students who want strong portfolio and job readiness",
    ],
  },
  {
    id: "basic_certification",
    title: "Basic Certification Program",
    fees: "₹999",
    feesNote: "One Time",
    duration: "1-15 Days (Self-paced)",
    mode: "Online",
    modeIcon: "laptop",
    image: "",
    color: "#059669",
    idealFor: "Students who want quick certificate at low cost and basic knowledge",
    highlights: [
      "High-quality training material (PDF + Videos)",
      "Topic-wise study modules",
      "Online Quiz / Assignment (MCQ + Subjective)",
      "Performance-based percentage certificate",
      "Digital Certificate with your Percentage / Grade",
      "Project files included (if applicable)",
    ],
  },
  {
    id: "free_hybrid_internship",
    title: "Free Hybrid Internship",
    fees: "₹0",
    feesNote: "Completely Free",
    duration: "1-3 Months",
    mode: "Online + Offline",
    modeIcon: "hybrid",
    image: "",
    color: "#d97706",
    idealFor: "Students who want flexibility and can manage studies + internship together",
    highlights: [
      "Mix of Online + Offline work experience",
      "Weekly tasks and real projects",
      "Mentorship from experienced team",
      "Certificate of Completion",
      "No stipend, no fees — completely free",
      "Flexible schedule for working students",
    ],
  },
  {
    id: "stipend_office_internship",
    title: "Stipend Based Office Internship",
    fees: "₹5,000/month",
    feesNote: "Stipend (You Earn)",
    duration: "1-3 Months",
    mode: "Office (Jaipur)",
    modeIcon: "office",
    image: "",
    color: "#dc2626",
    idealFor: "Serious students who can come to office daily, minimum 6 days a week",
    highlights: [
      "Full-time office work in Jaipur",
      "Working on Live Client Projects daily",
      "Daily learning + hands-on professional experience",
      "Professional corporate work environment",
      "Certificate + Experience Letter on completion",
      "Best performing interns can get Pre-Placement Offer",
    ],
  },
];

export async function GET() {
  try {
    // Try to load from settings
    const settings = await prisma.setting.findMany({
      where: {
        key: { startsWith: "program_type_" },
      },
    });

    const sMap: Record<string, string> = {};
    settings.forEach((s) => {
      sMap[s.key] = s.value;
    });

    // Build programs from settings, falling back to defaults
    const programs = defaultPrograms.map((def) => ({
      id: def.id,
      title: sMap[`program_type_${def.id}_title`] || def.title,
      fees: sMap[`program_type_${def.id}_fees`] || def.fees,
      feesNote: sMap[`program_type_${def.id}_fees_note`] || def.feesNote,
      duration: sMap[`program_type_${def.id}_duration`] || def.duration,
      mode: sMap[`program_type_${def.id}_mode`] || def.mode,
      modeIcon: def.modeIcon,
      image: sMap[`program_type_${def.id}_image`] || def.image,
      color: sMap[`program_type_${def.id}_color`] || def.color,
      idealFor: sMap[`program_type_${def.id}_ideal_for`] || def.idealFor,
      highlights: sMap[`program_type_${def.id}_highlights`]
        ? sMap[`program_type_${def.id}_highlights`].split("\n").filter(Boolean)
        : def.highlights,
      enabled: sMap[`program_type_${def.id}_enabled`] !== "false",
    }));

    return NextResponse.json(programs.filter((p) => p.enabled));
  } catch {
    return NextResponse.json(defaultPrograms);
  }
}
