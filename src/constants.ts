import { SiteSettings, PageConfig, User, UserRole } from './types';

export const DEFAULT_SETTINGS: SiteSettings = {
  bandName: "Westwood Community Band",
  logoUrl: "https://picsum.photos/id/1025/200/200",
  primaryColor: "#1e3a8a",
  secondaryColor: "#dc2626",
  footerText: "© 2024 Westwood Community Band. Supporting local music since 1985.",
  navLinks: [
    { id: '1', label: 'Home', path: '/', order: 0 },
    { id: '2', label: 'About', path: '/about', order: 1 },
    { id: '3', label: 'Schedule', path: '/schedule', order: 2 },
    { id: '4', label: 'Join Us', path: '/join', order: 3 },
    { id: '5', label: 'Contact', path: '/contact', order: 4 },
  ]
};

export const INITIAL_PAGES: PageConfig[] = [
  {
    id: 'home',
    title: 'Home',
    slug: '/',
    layout: 'full',
    sidebarWidth: 25,
    sections: [
      {
        id: 'h1',
        type: 'hero',
        title: 'Making Music Together',
        content: 'The Westwood Community Band is a non-profit organization dedicated to bringing quality music to our local community. We welcome musicians of all skill levels!',
        imageUrl: 'https://picsum.photos/id/10/1200/600'
      },
      {
        id: 'h2',
        type: 'text',
        title: 'Our Mission',
        content: 'To provide a welcoming environment for musicians to perform and grow, while entertaining the Westwood area with diverse musical performances.'
      }
    ]
  },
  {
    id: 'about',
    title: 'About Us',
    slug: '/about',
    layout: 'sidebar-right',
    sidebarWidth: 30,
    sections: [
      {
        id: 'a1',
        type: 'image-text',
        title: 'History of the Band',
        content: 'Founded in 1985 by a group of passionate local musicians, we have grown from a small ensemble to a full community concert band.',
        imageUrl: 'https://picsum.photos/id/103/600/400'
      }
    ]
  },
  {
    id: 'schedule',
    title: 'Schedule',
    slug: '/schedule',
    layout: 'full',
    sidebarWidth: 25,
    sections: [
      {
        id: 's1',
        type: 'schedule',
        title: 'Upcoming Performances',
        content: 'Check out our winter concert series!'
      }
    ]
  }
];

export const INITIAL_USERS: User[] = [
  { id: 'admin-1', username: 'admin', role: UserRole.ADMIN, email: 'admin@westwoodband.ca' },
  { id: 'editor-1', username: 'editor', role: UserRole.EDITOR, email: 'editor@westwoodband.ca' }
];
