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

export interface ContactRecipient {
  id: string;
  label: string;
}

/** Preset styling for sections – applied via Tailwind, no raw CSS. */
export interface SectionStyle {
  padding?: 'none' | 'small' | 'medium' | 'large';
  border?: 'none' | 'thin' | 'medium' | 'thick';
  borderRadius?: 'none' | 'small' | 'medium' | 'round';
  imagePosition?: 'left' | 'right' | 'top' | 'full';
  imageSize?: 'small' | 'medium' | 'large';
}

export interface PageSection {
  id: string;
  type: 'hero' | 'text' | 'image-text' | 'gallery' | 'contact' | 'schedule' | 'table' | 'separator';
  title: string;
  content: string;
  imageUrl?: string;
  /** Optional preset styling for this block. */
  style?: SectionStyle;
  /** For type === 'table': headers and rows. */
  tableData?: { headers: string[]; rows: string[][] };
  /** For type === 'separator'. */
  separatorStyle?: 'line' | 'space' | 'dotted';
  separatorSpacing?: 'small' | 'medium' | 'large';
  /** For type === 'contact': options for the \"Send to\" dropdown. */
  contactRecipients?: ContactRecipient[];
}

export type SidebarBlockType = 'rehearsals' | 'fees' | 'contact' | 'custom';

export interface SidebarBlock {
  id: string;
  type: SidebarBlockType;
  title?: string;
  content?: string;
  order: number;
}

export interface PageConfig {
  id: string;
  title: string;
  slug: string;
  layout: 'full' | 'sidebar-left' | 'sidebar-right';
  sidebarWidth: number;
  sections: PageSection[];
  /** Editable sidebar blocks; when absent, default blocks are used. */
  sidebarBlocks?: SidebarBlock[];
  /** Show this page in header/footer nav. Default true. */
  showInNav?: boolean;
  /** Order in nav (lower first). */
  navOrder?: number;
  /** Menu label; if absent, use title. */
  navLabel?: string;
}

export interface SiteSettings {
  bandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
}

export interface AppState {
  settings: SiteSettings;
  pages: PageConfig[];
  users: User[];
  currentUser: User | null;
}
