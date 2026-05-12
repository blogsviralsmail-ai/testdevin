import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BlogPostClient from "./BlogPostClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await prisma.blogPost.findFirst({
    where: { slug, isPublished: true },
    select: { title: true, excerpt: true, tags: true, coverImage: true, author: true, state: true, city: true, updatedAt: true },
  });

  if (!blog) {
    return { title: "Blog Post Not Found | KKHS Media" };
  }

  const keywords = [blog.tags, blog.state, blog.city, "KKHS Media", "internship 2026"].filter(Boolean).join(", ");

  return {
    title: `${blog.title} | KKHS Media`,
    description: blog.excerpt || `Read ${blog.title} on KKHS Media Blog`,
    keywords,
    authors: [{ name: blog.author }],
    openGraph: {
      title: blog.title,
      description: blog.excerpt || `Read ${blog.title} on KKHS Media Blog`,
      url: `https://internship.kkhsmedia.com/blog/${slug}`,
      siteName: "KKHS Media",
      type: "article",
      images: blog.coverImage ? [{ url: `https://internship.kkhsmedia.com${blog.coverImage}` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt || `Read ${blog.title} on KKHS Media Blog`,
      images: blog.coverImage ? [`https://internship.kkhsmedia.com${blog.coverImage}`] : undefined,
    },
    alternates: {
      canonical: `https://internship.kkhsmedia.com/blog/${slug}`,
    },
  };
}

function extractFAQs(content: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const faqPattern = /<h[23][^>]*>(.*?)<\/h[23]>\s*<p>(.*?)<\/p>/gi;
  let match;
  let inFaqSection = false;

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/FAQ|Frequently Asked/i.test(line)) {
      inFaqSection = true;
      continue;
    }
    if (inFaqSection) {
      const questionMatch = line.match(/<h[23][^>]*>(.*?)<\/h[23]>/i);
      if (questionMatch) {
        let answer = "";
        for (let j = i + 1; j < lines.length; j++) {
          if (/<h[23]/.test(lines[j])) break;
          const pMatch = lines[j].match(/<p[^>]*>(.*?)<\/p>/i);
          if (pMatch) {
            answer = pMatch[1].replace(/<[^>]*>/g, "").trim();
            break;
          }
        }
        if (answer) {
          faqs.push({
            question: questionMatch[1].replace(/<[^>]*>/g, "").trim(),
            answer,
          });
        }
      }
    }
  }

  if (faqs.length === 0) {
    while ((match = faqPattern.exec(content)) !== null) {
      const q = match[1].replace(/<[^>]*>/g, "").trim();
      const a = match[2].replace(/<[^>]*>/g, "").trim();
      if (q.includes("?") && a.length > 20) {
        faqs.push({ question: q, answer: a });
      }
    }
  }

  return faqs.slice(0, 10);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await prisma.blogPost.findFirst({
    where: { slug, isPublished: true },
  });

  if (!blog) {
    notFound();
  }

  // Increment views
  try {
    await prisma.blogPost.update({
      where: { id: blog.id },
      data: { views: (blog.views || 0) + 1 },
    });
  } catch {
    // ignore view count errors
  }

  // Get ad settings
  let adBefore = "";
  let adAfter = "";
  try {
    const adBeforeSetting = await prisma.setting.findUnique({ where: { key: "adsense_ad_before" } });
    const adAfterSetting = await prisma.setting.findUnique({ where: { key: "adsense_ad_after" } });
    adBefore = adBeforeSetting?.value || "";
    adAfter = adAfterSetting?.value || "";
  } catch {
    // ignore
  }

  // Get related articles (same state or city)
  let relatedArticles: { title: string; slug: string; state: string | null; city: string | null }[] = [];
  try {
    const related = await prisma.blogPost.findMany({
      where: {
        isPublished: true,
        id: { not: blog.id },
        OR: [
          ...(blog.state ? [{ state: blog.state }] : []),
          ...(blog.city ? [{ city: blog.city }] : []),
          { category: blog.category },
        ],
      },
      select: { title: true, slug: true, state: true, city: true },
      take: 4,
    });
    relatedArticles = related;
  } catch {
    // ignore
  }

  const faqs = extractFAQs(blog.content);

  // Article Schema
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt || blog.title,
    image: blog.coverImage ? `https://internship.kkhsmedia.com${blog.coverImage}` : undefined,
    author: {
      "@type": "Organization",
      name: "KKHS Media",
      url: "https://internship.kkhsmedia.com",
      logo: "https://internship.kkhsmedia.com/logo-kkhs.png",
    },
    publisher: {
      "@type": "Organization",
      name: "KKHS Media",
      url: "https://internship.kkhsmedia.com",
      logo: { "@type": "ImageObject", url: "https://internship.kkhsmedia.com/logo-kkhs.png" },
    },
    datePublished: blog.createdAt.toISOString(),
    dateModified: blog.updatedAt.toISOString(),
    mainEntityOfPage: `https://internship.kkhsmedia.com/blog/${blog.slug}`,
    keywords: blog.tags || undefined,
    inLanguage: "en-IN",
  };

  // BreadcrumbList Schema
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://internship.kkhsmedia.com" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://internship.kkhsmedia.com/blog" },
  ];
  let pos = 3;
  if (blog.state) {
    breadcrumbItems.push({ "@type": "ListItem", position: pos++, name: blog.state, item: `https://internship.kkhsmedia.com/blog?state=${encodeURIComponent(blog.state)}` });
  }
  if (blog.city) {
    breadcrumbItems.push({ "@type": "ListItem", position: pos++, name: blog.city, item: `https://internship.kkhsmedia.com/blog?city=${encodeURIComponent(blog.city)}` });
  }
  breadcrumbItems.push({ "@type": "ListItem", position: pos, name: blog.title, item: `https://internship.kkhsmedia.com/blog/${blog.slug}` });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  // FAQPage Schema
  const faqJsonLd = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <BlogPostClient
        blog={{
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          content: blog.content,
          coverImage: blog.coverImage,
          author: blog.author,
          category: blog.category,
          tags: blog.tags,
          state: blog.state,
          city: blog.city,
          createdAt: blog.createdAt.toISOString(),
          updatedAt: blog.updatedAt.toISOString(),
          views: blog.views || 0,
        }}
        adBefore={adBefore}
        adAfter={adAfter}
        relatedArticles={relatedArticles}
      />
    </>
  );
}
