import { SiteSettings, PageConfig, User, UserRole, SidebarBlock } from './types';

/** Default sidebar blocks used when a page has sidebar layout but no custom sidebarBlocks. */
export const DEFAULT_SIDEBAR_BLOCKS: SidebarBlock[] = [
  { id: 'sb-rehearsals', type: 'rehearsals', order: 0 },
  { id: 'sb-fees', type: 'fees', order: 1 },
  { id: 'sb-contact', type: 'contact', order: 2 },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  bandName: "Westwood Community Band",
  logoUrl: "/treble-clef.svg",
  primaryColor: "#991b1b",  /* Westwood red */
  secondaryColor: "#1e3a8a",
  footerText: "\u00a9 2026 Westwood Community Band. Forty-five Years of Making Music.",
};

export const INITIAL_PAGES: PageConfig[] = [
  {
    id: 'home',
    title: 'Home',
    slug: '/',
    layout: 'full',
    sidebarWidth: 25,
    showInNav: true,
    navOrder: 0,
    sections: [
      {
        id: 'h1',
        type: 'hero',
        title: 'Forty-five Years of Making Music',
        content: 'The Westwood Community Band is based in Winnipeg, Manitoba, Canada. Since 1980, we have been bringing quality music to our local community.',
        imageUrl: '/images/band-hero.jpg'
      },
      {
        id: 'h2',
        type: 'text',
        title: 'Our History',
        content: 'In 1980, the band director of Sansome School challenged the parents of his band students to form their own group, with the purpose of leading by example. A number of these parents responded and their on-going dedication, boosted by a steady input of new members, has blossomed into the Westwood Community Band. Some of those original parents are still enthusiastic members!'
      },
      {
        id: 'h3',
        type: 'text',
        title: 'Our Mission',
        content: "The Band's objectives are to play good music and offer musical entertainment to the wider community. The Band welcomes adults, beginners through to accomplished musicians, who play woodwind, brass, or percussion instruments. We practice from September \u2013 June, Thursday nights at John Taylor Collegiate."
      },
      {
        id: 'h4',
        type: 'text',
        title: 'Join Us',
        content: 'This is a friendly environment. New members are welcome to sit in for a couple of nights with no commitment necessary. You will soon feel at home! If you are considering joining us or if you would like to book Westwood Community Band to play at an event, please contact us.'
      }
    ]
  },
  {
    id: 'performances',
    title: 'Performances 2024/25',
    slug: '/performances',
    layout: 'full',
    sidebarWidth: 25,
    showInNav: true,
    navOrder: 1,
    navLabel: 'Performances',
    sections: [
      {
        id: 'p1',
        type: 'hero',
        title: 'Upcoming Performances',
        content: 'Join us at our upcoming concerts and events throughout the 2024/25 season.',
        imageUrl: '/images/performance.jpg'
      },
      {
        id: 'p2',
        type: 'performances',
        title: 'Concert Schedule',
        content: '',
        performanceItems: [
          { id: 'perf-1', date: 'March 15, 2025', title: 'Spring Concert', venue: 'John Taylor Collegiate', time: '7:00 PM', description: 'Join us for an evening of classic and contemporary concert band music.' },
          { id: 'perf-2', date: 'May 20, 2025', title: 'Community Showcase', venue: 'Assiniboine Park Bandstand', time: '2:00 PM', description: 'A free outdoor performance for the whole community.' },
          { id: 'perf-3', date: 'June 12, 2025', title: 'Season Finale', venue: 'John Taylor Collegiate', time: '7:00 PM', description: 'Celebrate the end of our 2024/25 season with a grand finale concert.' },
          { id: 'perf-4', date: 'December 14, 2024', title: 'Holiday Concert', venue: 'John Taylor Collegiate', time: '7:00 PM', description: 'Our annual holiday concert featuring seasonal favourites and festive classics.' },
          { id: 'perf-5', date: 'October 26, 2024', title: 'Fall Harvest Concert', venue: 'Cmakeill Community Centre', time: '2:00 PM', description: 'An afternoon of autumnal tunes and classic marches.' },
        ],
      }
    ]
  },
  {
    id: 'media',
    title: 'Media',
    slug: '/media',
    layout: 'full',
    sidebarWidth: 25,
    showInNav: true,
    navOrder: 2,
    sections: [
      {
        id: 'm1',
        type: 'hero',
        title: 'Photos, Recordings & Videos',
        content: 'Browse photos from our concerts, listen to recordings, and watch videos of the Westwood Community Band.',
        imageUrl: '/images/media.jpg'
      },
      {
        id: 'm2-photos',
        type: 'gallery',
        title: 'Photos',
        content: '',
        tabGroup: 'media',
        tabLabel: 'Photos',
        galleryEvents: [
          { id: 'ph-spring-2025', title: 'Spring Concert 2025', slug: 'spring-concert-2025', description: 'Photos from our Spring 2025 concert.', media: [] },
          { id: 'ph-holiday-2024', title: 'Holiday Concert 2024', slug: 'holiday-concert-2024', description: 'Festive moments from our Holiday 2024 concert.', media: [] },
          { id: 'ph-spring-2024', title: 'Spring Concert 2024', slug: 'spring-concert-2024', description: 'Highlights from our Spring 2024 performance.', media: [] },
          { id: 'ph-holiday-2023', title: 'Holiday Concert 2023', slug: 'holiday-concert-2023', description: 'Scenes from our Holiday 2023 concert.', media: [] },
          { id: 'ph-rehearsals', title: 'Rehearsals', slug: 'rehearsals', description: 'Behind the scenes at our Thursday night rehearsals.', media: [] },
          { id: 'ph-community-events', title: 'Community Events', slug: 'community-events', description: 'The band out and about in the community.', media: [] },
        ],
      },
      {
        id: 'm2-recordings',
        type: 'audio-playlist',
        title: 'Recordings',
        content: '',
        tabGroup: 'media',
        tabLabel: 'Recordings',
        audioItems: [
          { id: 'r-liberty-bell', type: 'audio', url: '#', caption: 'Liberty Bell', duration: '2:47' },
          { id: 'r-big-band-showcase', type: 'audio', url: '#', caption: 'Big Band Showcase', duration: '8:20' },
          { id: 'r-it-dont-mean-a-thing', type: 'audio', url: '#', caption: 'It Don\'t Mean a Thing', duration: '3:25' },
          { id: 'r-count-basie-salute', type: 'audio', url: '#', caption: 'Count Basie Salute', duration: '4:17' },
          { id: 'r-themes-like-old-times', type: 'audio', url: '#', caption: 'Themes Like Old Times', duration: '5:35' },
          { id: 'r-caravan', type: 'audio', url: '#', caption: 'Caravan', duration: '2:46' },
          { id: 'r-swing-the-mood', type: 'audio', url: '#', caption: 'Swing the Mood', duration: '3:38' },
          { id: 'r-blues-brothers-revue', type: 'audio', url: '#', caption: 'Blues Brothers Revue', duration: '5:12' },
        ],
      },
      {
        id: 'm2-videos',
        type: 'video-gallery',
        title: 'Videos',
        content: '',
        tabGroup: 'media',
        tabLabel: 'Videos',
        videoItems: [],
      },
      {
        id: 'm3',
        type: 'text',
        title: 'International Music Camp',
        content: 'The <a href="http://www.internationalmusiccamp.com/" target="_blank" rel="noopener noreferrer">International Music Camp</a> is an annual event for students and adults that takes place at the International Peace Gardens on the border between Manitoba and North Dakota.\n\nThe adult camp is a 4-day event. Every year a significant number of Westwood Band members make the trek to attend. In 2006, Westwood were guest performers at IMC for our 25th anniversary. We loved performing for such an amazing audience. The performance was recorded and several of the tracks are available in the Recordings tab above.',
      },
      {
        id: 'm4',
        type: 'downloads',
        title: 'Band Documents',
        content: 'Download band resources including the complete music library listing.',
        downloadItems: [
          { label: 'Music List (Excel)', url: '#', description: 'Complete listing of music available in the Westwood Music Library.', fileSize: '39.5 KB' },
          { label: 'Music List (HTML)', url: '#', description: 'View the music list in your browser.' },
        ],
      }
    ]
  },
  {
    id: 'newsletter',
    title: 'Newsletter',
    slug: '/newsletter',
    layout: 'full',
    sidebarWidth: 25,
    showInNav: true,
    navOrder: 3,
    sections: [
      {
        id: 'nl1',
        type: 'hero',
        title: 'Newsletter Archive',
        content: 'Browse past issues of the Westwood Community Band newsletter.',
        imageUrl: '/images/band-hero.jpg'
      },
      {
        id: 'nl2',
        type: 'downloads',
        title: 'Past Issues',
        content: '',
        downloadGroups: [
          {
            title: '2014 \u2013 2015',
            items: [
              { label: 'Jan 22, 2015', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
              { label: 'Nov 20, 2014', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Oct 30, 2014', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Sep 11, 2014', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
            ],
          },
          {
            title: '2013 \u2013 2014',
            items: [
              { label: 'Jan 30, 2014', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
              { label: 'Nov 07, 2013', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Sep 19, 2013', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
            ],
          },
          {
            title: '2012 \u2013 2013',
            items: [
              { label: 'Jan 17, 2013', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Oct 18, 2012', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Sep 20, 2012', links: [{ label: 'Page 1', url: '#' }] },
            ],
          },
          {
            title: '2011 \u2013 2012',
            items: [
              { label: 'Nov 17, 2011', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Oct 20, 2011', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
            ],
          },
          {
            title: '2010 \u2013 2011',
            items: [
              { label: 'Jan 27, 2011', links: [{ label: 'Page 1', url: '#' }] },
            ],
          },
          {
            title: '2009 \u2013 2010',
            items: [
              { label: 'Nov 26, 2009', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
              { label: 'Sep 17, 2009', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
            ],
          },
          {
            title: '2008 \u2013 2009',
            items: [
              { label: 'May 07, 2009', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Jan 29, 2009', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Nov 20, 2008', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Oct 30, 2008', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
            ],
          },
          {
            title: '2007 \u2013 2008',
            items: [
              { label: 'May 22, 2008', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Jan 10, 2008', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Nov 22, 2007', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Nov 01, 2007', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Oct 04, 2007', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
            ],
          },
          {
            title: '2006 \u2013 2007',
            items: [
              { label: 'May 03, 2007', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Jan 11, 2007', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
              { label: 'Nov 23, 2006', links: [{ label: 'Page 1', url: '#' }] },
              { label: 'Nov 02, 2006', links: [{ label: 'Page 1', url: '#' }, { label: 'Page 2', url: '#' }] },
            ],
          },
        ],
      }
    ]
  },
  {
    id: 'join',
    title: 'Join Us',
    slug: '/join',
    layout: 'sidebar-right',
    sidebarWidth: 35,
    showInNav: true,
    navOrder: 5,
    sidebarBlocks: [...DEFAULT_SIDEBAR_BLOCKS],
    sections: [
      {
        id: 'j1',
        type: 'text',
        title: 'Welcome New Members',
        content: 'The Band welcomes adults, beginners through to accomplished musicians, who play woodwind, brass, or percussion instruments. This is a friendly environment, and new members are welcome to sit-in for a couple of nights with no commitment necessary. You will soon feel at home!'
      },
      {
        id: 'j2',
        type: 'text',
        title: 'Rehearsals',
        content: 'Thursday Evenings, 7:15 to 9:15 p.m.\n\nThe Band Room\nJohn Taylor Collegiate\n470 Hamilton Avenue\nWinnipeg, Manitoba'
      },
      {
        id: 'j3',
        type: 'text',
        title: 'Membership',
        content: 'The Band averages 40+ members from all parts of Winnipeg and from all walks of life: ages range from 18 to 80+.\n\nBand Season is from September to June.\nAnnual fee $100.00\nStudents $50.00\nWestwood Community Band Polo Shirt $15.00'
      },
      {
        id: 'j4',
        type: 'image-text',
        title: 'Musical Director',
        content: 'Virginia Helmer was a music teacher in the Pembina Trails School Division for 38 years, working with students from grades 5-9. She has been a member of the Winnipeg Wind Ensemble since 1986, has guest conducted the group on several occasions and was appointed Artistic Director in 2020. She conducted the Manitoba Junior Provincial Honour Band in 2019 and the Intermediate Honour Band in 2024. Ginny has been the music director of the Westwood Community Band since 2017.\n\nGinny holds a Bachelor\'s degree in Music Performance from the University of Western Ontario, and a Masters\' Degree in Education from the University of Manitoba. She has participated in conducting workshops with Glenn Price, Craig Kirchoff and Eugene Corporan, and successfully completed the Canadian Wind Conductors\' Development Program.',
        imageUrl: '/images/director.jpg'
      }
    ]
  },
  {
    id: 'contact',
    title: 'Contact',
    slug: '/contact',
    layout: 'sidebar-right',
    sidebarWidth: 40,
    showInNav: true,
    navOrder: 6,
    sidebarBlocks: [...DEFAULT_SIDEBAR_BLOCKS],
    sections: [
      {
        id: 'c1',
        type: 'contact',
        title: 'Contact the Band',
        content: 'If you have questions about the band, use the form to contact us!',
        contactRecipients: [
          { id: 'president', label: 'President' },
          { id: 'music-director', label: 'Music Director' },
          { id: 'booking', label: 'Booking' },
        ],
      },
      {
        id: 'c2',
        type: 'text',
        title: 'Executive Committee',
        content: 'President: Duncan Hasker\nMusical Director: Ginny Helmer\nVice President: Sherry Aubin\nSecretary: Doug Gibb\nTreasurer: David Patrick\nPast President: Greg McLean\nLibrarian: Mikaila Hardy\nGigs: Greg Barratt\nGigs: Ray Vance\nSocial Rep: Wendy Chapman\nSocial Rep: Shelley Greaves'
      }
    ]
  }
];

export const INITIAL_USERS: User[] = [
  { id: 'admin-1', username: 'admin', role: UserRole.ADMIN, email: 'admin@westwoodcommunityband.ca' },
  { id: 'editor-1', username: 'editor', role: UserRole.EDITOR, email: 'editor@westwoodcommunityband.ca' }
];

/** Create a new empty page for "Add page". Slug should be like "/about" (leading slash). */
export function createEmptyPage(title: string, slug: string, navOrder: number = 0): PageConfig {
  const id = Math.random().toString(36).substring(2, 11);
  return {
    id,
    title,
    slug: slug.startsWith('/') ? slug : `/${slug}`,
    layout: 'full',
    sidebarWidth: 25,
    showInNav: true,
    navOrder,
    isArchived: false,
    sections: [
      {
        id: Math.random().toString(36).substring(2, 11),
        type: 'text',
        title: 'New Section',
        content: 'Click here to edit content...',
      },
    ],
  };
}
