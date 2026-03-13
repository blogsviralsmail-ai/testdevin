import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  structuredData?: object;
}

const SITE_NAME = "A Step For Future - Education Hub";
const SITE_URL = "https://asffeducationhub.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION = "India's trusted education consultancy. Connect with 15+ top universities, explore 46+ courses, and get expert admission guidance. UGC recognized, NAAC accredited partner universities.";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = "education consultancy, university admission, online courses, distance education, UGC recognized, NAAC accredited, Jaipur, Rajasthan, India, B.Tech, MBA, BBA, BCA, MCA, B.Com, BA, MA, M.Sc, B.Sc",
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  noindex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - India's Trusted Education Partner`;
  const fullCanonical = canonical ? `${SITE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO */}
      <meta name="author" content="A Step For Future - Education Hub" />
      <meta name="geo.region" content="IN-RJ" />
      <meta name="geo.placename" content="Jaipur" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

// Pre-built structured data generators
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
        "name": "A Step For Future - Education Hub",
        "url": "https://asffeducationhub.com",
        "logo": "https://asffeducationhub.com/logo.png",
        "description": "A Step For Future - India's trusted education consultancy providing admission guidance to 15+ top universities with 46+ courses.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Jaipur",
      "addressRegion": "Rajasthan",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9876543210",
      "contactType": "customer service",
      "email": "info@asffeducationhub.com",
      "availableLanguage": ["English", "Hindi"]
    },
    "sameAs": [
      "https://facebook.com/asffeducationhub",
      "https://instagram.com/asffeducationhub",
      "https://linkedin.com/company/asffeducationhub",
      "https://youtube.com/asffeducationhub"
    ]
  };
}

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "A Step For Future - Education Hub",
    "url": "https://asffeducationhub.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://asffeducationhub.com/courses?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
}

export function getCourseSchema(course: { name: string; slug: string; university: string; duration: string; fee: string; mode: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.name,
    "url": `https://asffeducationhub.com/courses/${course.slug}`,
    "description": course.description || `${course.name} offered by ${course.university}. Duration: ${course.duration}. Mode: ${course.mode}.`,
    "provider": {
      "@type": "Organization",
      "name": course.university,
      "sameAs": "https://asffeducationhub.com"
    },
    "timeRequired": course.duration,
    "offers": {
      "@type": "Offer",
      "price": course.fee?.replace(/[^0-9]/g, "") || "0",
      "priceCurrency": "INR"
    }
  };
}

export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://asffeducationhub.com${item.url}`
    }))
  };
}
