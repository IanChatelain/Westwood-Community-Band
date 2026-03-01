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

export type PageSectionType = 'hero' | 'text' | 'image-text' | 'gallery' | 'contact' | 'schedule' | 'performances' | 'table' | 'separator' | 'downloads' | 'media-hub';

export interface PerformanceItem {
  id: string;
  date: string;
  title: string;
  venue?: string;
  time?: string;
  description?: string;
}

export interface DownloadLink {
  label: string;
  url: string;
}

export interface DownloadItem {
  label: string;
  url?: string;
  links?: DownloadLink[];
  description?: string;
  fileSize?: string;
  duration?: string;
}

export interface DownloadGroup {
  title: string;
  items: DownloadItem[];
}

export interface GalleryMediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  duration?: string;
}

export interface GalleryEvent {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string;
  description?: string;
  media: GalleryMediaItem[];
}

export interface PageSection {
  id: string;
  type: PageSectionType;
  title: string;
  content: string;
  imageUrl?: string;
  /** Optional preset styling for this block. */
  style?: SectionStyle;
  /** Min height in px (0 = auto). */
  minHeight?: number;
  /** Max width as percentage of container (25–100). */
  maxWidth?: number;
  /** For type === 'table': headers and rows. */
  tableData?: { headers: string[]; rows: string[][] };
  /** For type === 'separator'. */
  separatorStyle?: 'line' | 'space' | 'dotted';
  separatorSpacing?: 'small' | 'medium' | 'large';
  /** For type === 'contact': options for the \"Send to\" dropdown. */
  contactRecipients?: ContactRecipient[];
  /** For type === 'gallery': structured event-based gallery data. */
  galleryEvents?: GalleryEvent[];
  /** For type === 'gallery': number of cards per row on desktop (default 3). */
  galleryColumns?: 2 | 3 | 4;
  /** For type === 'gallery': card padding and text sizing preset (default 'md'). */
  galleryCardSize?: 'sm' | 'md' | 'lg';
  /** For type === 'gallery': thumbnail aspect ratio (default 'landscape'). */
  galleryThumbnailAspect?: 'landscape' | 'square';
  /** For type === 'gallery': show event description on cards (default true). */
  galleryShowDescription?: boolean;
  /** For type === 'downloads': flat list of downloadable items. */
  downloadItems?: DownloadItem[];
  /** For type === 'downloads': grouped lists (e.g. newsletter by season). */
  downloadGroups?: DownloadGroup[];
  /** For type === 'performances': structured performance/concert entries. */
  performanceItems?: PerformanceItem[];
  /** For type === 'media-hub': photo album events (reuses GalleryEvent). */
  mediaPhotos?: GalleryEvent[];
  /** For type === 'media-hub': audio recordings. */
  mediaRecordings?: GalleryMediaItem[];
  /** For type === 'media-hub': video items. */
  mediaVideos?: GalleryMediaItem[];
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
  /** When true, page is hidden from the public site and only visible in admin. */
  isArchived?: boolean;
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

/** Tailwind-style border presets – applied via classes. 'custom' uses raw width+color. */
export type BorderPreset =
  | 'none'
  | 'subtle'   // border-slate-200/60
  | 'default' // border-slate-300
  | 'muted'   // border-slate-200
  | 'accent'  // border-red-800/60
  | 'strong'  // border-2 slate-400
  | 'ring'    // ring-1 ring-slate-900/5 (shadcn card style)
  | 'custom'; // raw borderWidth + borderColor

/** Wrapper styling for blocks – size, color, border presets, shadow. */
export interface BlockWrapperStyle {
  maxWidth?: 'full' | 'content' | 'narrow' | number;
  minHeight?: number;
  backgroundColor?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  /** Named border preset (Tailwind/Shadcn style). */
  borderPreset?: BorderPreset;
  /** Only used when borderPreset is 'custom'. */
  borderWidth?: 0 | 1 | 2 | 4;
  borderColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export interface BuilderBlockBase {
  id: string;
  type: BuilderBlockType;
  /** Optional wrapper appearance (applied to the block container). */
  wrapperStyle?: BlockWrapperStyle;
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
  /** Hero section height in px (e.g. 160, 200, 260). Default 260. */
  heroHeightPx?: number;
}

export interface ImageBlock extends BuilderBlockBase {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
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
