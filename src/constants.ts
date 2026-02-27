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
        type: 'schedule',
        title: 'Concert Schedule',
        content: 'Check back regularly for updates to our performance schedule. We perform at various venues across Winnipeg and surrounding areas.'
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
        title: 'Media & Resources',
        content: 'Watch, listen, and access band resources \u2014 recordings, documents, and more.',
        imageUrl: '/images/media.jpg'
      },
      {
        id: 'm2',
        type: 'gallery',
        title: 'Featured Recordings',
        content: '',
        galleryColumns: 3,
        galleryCardSize: 'md',
        galleryThumbnailAspect: 'landscape',
        galleryShowDescription: true,
        galleryEvents: [
          { id: 'm-liberty-bell', title: 'Liberty Bell', slug: 'liberty-bell', description: 'A classic march by John Philip Sousa.', media: [] },
          { id: 'm-big-band-showcase', title: 'Big Band Showcase', slug: 'big-band-showcase', description: 'Highlights from our big band repertoire.', media: [] },
          { id: 'm-it-dont-mean-a-thing', title: 'It Don\'t Mean a Thing', slug: 'it-dont-mean-a-thing', description: 'Duke Ellington\'s iconic swing number.', media: [] },
          { id: 'm-count-basie-salute', title: 'Count Basie Salute', slug: 'count-basie-salute', description: 'A tribute to the legendary Count Basie.', media: [] },
          { id: 'm-themes-like-old-times', title: 'Themes Like Old Times', slug: 'themes-like-old-times', description: 'A nostalgic medley of timeless melodies.', media: [] },
          { id: 'm-caravan', title: 'Caravan', slug: 'caravan', description: 'The classic Duke Ellington and Juan Tizol composition.', media: [] },
          { id: 'm-swing-the-mood', title: 'Swing the Mood', slug: 'swing-the-mood', description: 'An energetic swing medley.', media: [] },
          { id: 'm-blues-brothers-revue', title: 'Blues Brothers Revue', slug: 'blues-brothers-revue', description: 'A rockin\' tribute to the Blues Brothers.', media: [] },
        ],
      },
      {
        id: 'm3',
        type: 'downloads',
        title: 'Sample Recordings',
        content: 'Tracks recorded during Westwood\'s 25th Anniversary Concert on July 30th, 2006 at the International Music Camp.',
        downloadItems: [
          { label: 'Liberty Bell', url: '#', description: 'A classic march by John Philip Sousa.', fileSize: '2.54 MB', duration: '2:47' },
          { label: 'Big Band Showcase', url: '#', description: 'Highlights from our big band repertoire.', fileSize: '7.63 MB', duration: '8:20' },
          { label: 'It Don\'t Mean a Thing', url: '#', description: 'Duke Ellington\'s iconic swing number.', fileSize: '3.12 MB', duration: '3:25' },
          { label: 'Count Basie Salute', url: '#', description: 'A tribute to the legendary Count Basie.', fileSize: '3.91 MB', duration: '4:17' },
          { label: 'Themes Like Old Times', url: '#', description: 'A nostalgic medley of timeless melodies.', fileSize: '5.11 MB', duration: '5:35' },
          { label: 'Caravan', url: '#', description: 'The classic Duke Ellington and Juan Tizol composition.', fileSize: '2.53 MB', duration: '2:46' },
          { label: 'Swing the Mood', url: '#', description: 'An energetic swing medley.', fileSize: '3.31 MB', duration: '3:38' },
          { label: 'Blues Brothers Revue', url: '#', description: 'A rockin\' tribute to the Blues Brothers.', fileSize: '4.75 MB', duration: '5:12' },
        ],
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
      },
      {
        id: 'm5',
        type: 'text',
        title: 'International Music Camp',
        content: 'The <a href="http://www.internationalmusiccamp.com/" target="_blank" rel="noopener noreferrer">International Music Camp</a> is an annual event for students and adults that takes place at the International Peace Gardens on the border between Manitoba and North Dakota.\n\nThe adult camp is a 4-day event. Every year a significant number of Westwood Band members make the trek to attend. In 2006, Westwood were guest performers at IMC for our 25th anniversary. We loved performing for such an amazing audience. The performance was recorded and several of the tracks are available above in our Sample Recordings section.',
      }
    ]
  },
  {
    id: 'photos',
    title: 'Photos',
    slug: '/photos',
    layout: 'full',
    sidebarWidth: 25,
    showInNav: true,
    navOrder: 4,
    sections: [
      {
        id: 'ph1',
        type: 'hero',
        title: 'Photo Gallery',
        content: 'Browse photos from our concerts, rehearsals, and special events over the years.',
        imageUrl: '/images/photos.jpg'
      },
      {
        id: 'ph2',
        type: 'gallery',
        title: 'Event Photos',
        content: '',
        galleryColumns: 3,
        galleryCardSize: 'md',
        galleryThumbnailAspect: 'landscape',
        galleryShowDescription: true,
        galleryEvents: [
          { id: 'ph-spring-2025', title: 'Spring Concert 2025', slug: 'spring-concert-2025', description: 'Photos from our Spring 2025 concert.', media: [] },
          { id: 'ph-holiday-2024', title: 'Holiday Concert 2024', slug: 'holiday-concert-2024', description: 'Festive moments from our Holiday 2024 concert.', media: [] },
          { id: 'ph-spring-2024', title: 'Spring Concert 2024', slug: 'spring-concert-2024', description: 'Highlights from our Spring 2024 performance.', media: [] },
          { id: 'ph-holiday-2023', title: 'Holiday Concert 2023', slug: 'holiday-concert-2023', description: 'Scenes from our Holiday 2023 concert.', media: [] },
          { id: 'ph-rehearsals', title: 'Rehearsals', slug: 'rehearsals', description: 'Behind the scenes at our Thursday night rehearsals.', media: [] },
          { id: 'ph-community-events', title: 'Community Events', slug: 'community-events', description: 'The band out and about in the community.', media: [] },
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
