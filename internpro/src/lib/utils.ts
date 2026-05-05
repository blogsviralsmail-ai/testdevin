export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateCertNumber(): string {
  const year = new Date().getFullYear();
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes)
    .map((b) => b.toString(36))
    .join("")
    .substring(0, 12)
    .toUpperCase();
  return `IP-${year}-${random}`;
}

export function generateUniqueId(prefix: string): string {
  const year = new Date().getFullYear();
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes)
    .map((b) => b.toString(36))
    .join("")
    .substring(0, 8)
    .toUpperCase();
  return `${prefix}-${year}-${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function getDomainLabel(domain: string): string {
  const labels: Record<string, string> = {
    "web-dev": "Web Development",
    "app-dev": "App Development",
    "data-science": "Data Science",
    "ai-ml": "AI & Machine Learning",
    marketing: "Digital Marketing",
    design: "UI/UX Design",
    "content-writing": "Content Writing",
    "graphic-design": "Graphic Design",
    "video-editing": "Video Editing",
    "cyber-security": "Cyber Security",
    other: "Other",
  };
  return labels[domain] || domain;
}

export function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    online: "Online",
    offline: "Offline",
    hybrid: "Hybrid",
  };
  return labels[mode] || mode;
}

export function getFeeTypeLabel(feeType: string): string {
  const labels: Record<string, string> = {
    free: "Free",
    paid: "Paid",
    stipend: "Stipend Provided",
  };
  return labels[feeType] || feeType;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    completed: "bg-purple-100 text-purple-800",
    dropped: "bg-red-100 text-red-800",
    present: "bg-green-100 text-green-800",
    absent: "bg-red-100 text-red-800",
    late: "bg-orange-100 text-orange-800",
    "half-day": "bg-yellow-100 text-yellow-800",
    leave: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    reviewed: "bg-purple-100 text-purple-800",
    rejected: "bg-red-100 text-red-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    processed: "bg-blue-100 text-blue-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
