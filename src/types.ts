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
  /** Optional block-based builder content for visual editor. */
  blocks?: BuilderBlock[];
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
  pageBuilder: PageBuilderState;
}

// --- Visual Page Builder types ---

export type BuilderBlockType =
  | 'richText'
  | 'image'
  | 'separator'
  | 'spacer'
  | 'button';

export interface BuilderBlockBase {
  id: string;
  type: BuilderBlockType;
}

export interface RichTextBlock extends BuilderBlockBase {
  type: 'richText';
  content: string;
  /** Display style: text (plain), header (bordered heading), hero (banner). Default 'text'. */
  displayStyle?: 'text' | 'header' | 'hero';
  /** Title for header/hero styles. */
  title?: string;
  /** Background image for hero style. */
  imageUrl?: string;
}

export interface ImageBlock extends BuilderBlockBase {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  borderRadius?: number;
  padding?: number;
}

export interface SeparatorBlock extends BuilderBlockBase {
  type: 'separator';
  thickness?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  width?: 'full' | 'content' | 'narrow';
}

export interface SpacerBlock extends BuilderBlockBase {
  type: 'spacer';
  height: number;
}

export interface ButtonBlock extends BuilderBlockBase {
  type: 'button';
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;
}

export type BuilderBlock =
  | RichTextBlock
  | ImageBlock
  | SeparatorBlock
  | SpacerBlock
  | ButtonBlock;

export interface BuilderPage {
  id: string;
  slug: string;
  title: string;
  blocks: BuilderBlock[];
}

export interface PageBuilderState {
  /** Currently edited page in the visual builder. */
  currentPageId: string | null;
  /** Normalized builder pages keyed by PageConfig.id. */
  pages: Record<string, BuilderPage>;
  /** Tracks unsaved changes per page. */
  isDirtyByPageId: Record<string, boolean>;
  /** Tracks currently selected block per page for configuration UI. */
  selectedBlockIdByPageId: Record<string, string | null>;
}

export interface PageBuilderActions {
  selectPage: (pageId: string | null) => void;
  setBlocks: (pageId: string, blocks: BuilderBlock[]) => void;
  addBlock: (pageId: string, block: BuilderBlock, index?: number) => void;
  updateBlock: (
    pageId: string,
    blockId: string,
    updater: (block: BuilderBlock) => BuilderBlock
  ) => void;
  removeBlock: (pageId: string, blockId: string) => void;
  moveBlock: (pageId: string, blockId: string, toIndex: number) => void;
  duplicateBlock: (pageId: string, blockId: string) => void;
  selectBlock: (pageId: string, blockId: string | null) => void;
}

export interface PageBuilderStore extends PageBuilderState, PageBuilderActions {}
