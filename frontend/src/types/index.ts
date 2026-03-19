export interface GoldRate {
  id: number;
  date: string;
  gold_24k: number;
  gold_22k: number;
  gold_18k: number;
  silver_rate: number;
  city: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  name_hi: string;
  slug: string;
  description: string;
  description_hi: string;
  image_url: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  design_count: number;
}

export interface Design {
  id: number;
  title: string;
  title_hi: string;
  slug: string;
  category_id: number;
  description: string;
  description_hi: string;
  weight_grams: number;
  purity: string;
  price_range: string;
  images: string[];
  tags: string;
  is_featured: number;
  is_active: number;
  views: number;
  created_at: string;
  category_name?: string;
  category_name_hi?: string;
  category_slug?: string;
}

export interface Blog {
  id: number;
  title: string;
  title_hi: string;
  slug: string;
  content: string;
  content_hi: string;
  excerpt_hi: string;
  category: string;
  tags: string;
  image_url: string;
  is_published: number;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  username: string;
  token: string;
}

export interface DashboardStats {
  total_categories: number;
  total_designs: number;
  active_designs: number;
  featured_designs: number;
  total_blogs: number;
  published_blogs: number;
  total_views: number;
  blog_views: number;
}
