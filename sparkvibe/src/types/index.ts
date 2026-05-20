export interface QuizOption {
  id: string;
  label: string;
  emoji: string;
  description?: string;
  image?: string;
}

export interface QuizQuestion {
  id: string;
  title: string;
  subtitle?: string;
  options: QuizOption[];
}

export interface ProfileCard {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  image: string;
  matchPercent: number;
  online: boolean;
  verified: boolean;
  interests: string[];
  pricePerMinute?: number;
}

export interface FunnelAnswers {
  ageVerified: boolean;
  gender: string;
  connectionType: string;
  quizAnswers: Record<string, string>;
}

export interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  enabled: boolean;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  logo?: string;
  primaryColor: string;
  analyticsId?: string;
  adsenseId?: string;
  metaPixelId?: string;
}
