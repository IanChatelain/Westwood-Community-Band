export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email: string;
}

export interface NavLink {
  id: string;
  label: string;
  path: string;
  order: number;
}

export interface PageSection {
  id: string;
  type: 'hero' | 'text' | 'image-text' | 'gallery' | 'contact' | 'schedule';
  title: string;
  content: string;
  imageUrl?: string;
}

export interface PageConfig {
  id: string;
  title: string;
  slug: string;
  layout: 'full' | 'sidebar-left' | 'sidebar-right';
  sidebarWidth: number;
  sections: PageSection[];
}

export interface SiteSettings {
  bandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  navLinks: NavLink[];
}

export interface AppState {
  settings: SiteSettings;
  pages: PageConfig[];
  users: User[];
  currentUser: User | null;
}
