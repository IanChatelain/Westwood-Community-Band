-- Add downloads sections (samples, documents, IMC) to the Media page
-- and insert a new Newsletter page with grouped download links.
-- Also adjusts nav_order so the navigation is:
--   Home(0) / Performances(1) / Media(2) / Newsletter(3) / Photos(4) / Join Us(5) / Contact(6)

-- ============================================================
-- 1. Update Media page: add sample recordings, documents, IMC
-- ============================================================
UPDATE pages
SET sections = '[
  {
    "id": "m1",
    "type": "hero",
    "title": "Media & Resources",
    "content": "Watch, listen, and access band resources \u2014 recordings, documents, and more.",
    "imageUrl": "/images/media.jpg"
  },
  {
    "id": "m2",
    "type": "gallery",
    "title": "Featured Recordings",
    "content": "",
    "galleryColumns": 3,
    "galleryCardSize": "md",
    "galleryThumbnailAspect": "landscape",
    "galleryShowDescription": true,
    "galleryEvents": [
      {"id":"m-liberty-bell","title":"Liberty Bell","slug":"liberty-bell","description":"A classic march by John Philip Sousa.","media":[]},
      {"id":"m-big-band-showcase","title":"Big Band Showcase","slug":"big-band-showcase","description":"Highlights from our big band repertoire.","media":[]},
      {"id":"m-it-dont-mean-a-thing","title":"It Don''t Mean a Thing","slug":"it-dont-mean-a-thing","description":"Duke Ellington''s iconic swing number.","media":[]},
      {"id":"m-count-basie-salute","title":"Count Basie Salute","slug":"count-basie-salute","description":"A tribute to the legendary Count Basie.","media":[]},
      {"id":"m-themes-like-old-times","title":"Themes Like Old Times","slug":"themes-like-old-times","description":"A nostalgic medley of timeless melodies.","media":[]},
      {"id":"m-caravan","title":"Caravan","slug":"caravan","description":"The classic Duke Ellington and Juan Tizol composition.","media":[]},
      {"id":"m-swing-the-mood","title":"Swing the Mood","slug":"swing-the-mood","description":"An energetic swing medley.","media":[]},
      {"id":"m-blues-brothers-revue","title":"Blues Brothers Revue","slug":"blues-brothers-revue","description":"A rockin'' tribute to the Blues Brothers.","media":[]}
    ]
  },
  {
    "id": "m3",
    "type": "downloads",
    "title": "Sample Recordings",
    "content": "Tracks recorded during Westwood''s 25th Anniversary Concert on July 30th, 2006 at the International Music Camp.",
    "downloadItems": [
      {"label":"Liberty Bell","url":"#","description":"A classic march by John Philip Sousa.","fileSize":"2.54 MB","duration":"2:47"},
      {"label":"Big Band Showcase","url":"#","description":"Highlights from our big band repertoire.","fileSize":"7.63 MB","duration":"8:20"},
      {"label":"It Don''t Mean a Thing","url":"#","description":"Duke Ellington''s iconic swing number.","fileSize":"3.12 MB","duration":"3:25"},
      {"label":"Count Basie Salute","url":"#","description":"A tribute to the legendary Count Basie.","fileSize":"3.91 MB","duration":"4:17"},
      {"label":"Themes Like Old Times","url":"#","description":"A nostalgic medley of timeless melodies.","fileSize":"5.11 MB","duration":"5:35"},
      {"label":"Caravan","url":"#","description":"The classic Duke Ellington and Juan Tizol composition.","fileSize":"2.53 MB","duration":"2:46"},
      {"label":"Swing the Mood","url":"#","description":"An energetic swing medley.","fileSize":"3.31 MB","duration":"3:38"},
      {"label":"Blues Brothers Revue","url":"#","description":"A rockin'' tribute to the Blues Brothers.","fileSize":"4.75 MB","duration":"5:12"}
    ]
  },
  {
    "id": "m4",
    "type": "downloads",
    "title": "Band Documents",
    "content": "Download band resources including the complete music library listing.",
    "downloadItems": [
      {"label":"Music List (Excel)","url":"#","description":"Complete listing of music available in the Westwood Music Library.","fileSize":"39.5 KB"},
      {"label":"Music List (HTML)","url":"#","description":"View the music list in your browser."}
    ]
  },
  {
    "id": "m5",
    "type": "text",
    "title": "International Music Camp",
    "content": "The <a href=\"http://www.internationalmusiccamp.com/\" target=\"_blank\" rel=\"noopener noreferrer\">International Music Camp</a> is an annual event for students and adults that takes place at the International Peace Gardens on the border between Manitoba and North Dakota.\n\nThe adult camp is a 4-day event. Every year a significant number of Westwood Band members make the trek to attend. In 2006, Westwood were guest performers at IMC for our 25th anniversary. We loved performing for such an amazing audience. The performance was recorded and several of the tracks are available above in our Sample Recordings section."
  }
]'::jsonb
WHERE id = 'media';

-- ============================================================
-- 2. Adjust nav_order for existing pages
-- ============================================================
UPDATE pages SET nav_order = 4 WHERE id = 'photos';
UPDATE pages SET nav_order = 5 WHERE id = 'join';
UPDATE pages SET nav_order = 6 WHERE id = 'contact';

-- ============================================================
-- 3. Insert Newsletter page
-- ============================================================
INSERT INTO pages (id, title, slug, layout, sidebar_width, sections, show_in_nav, nav_order, nav_label)
VALUES (
  'newsletter',
  'Newsletter',
  '/newsletter',
  'full',
  25,
  '[
    {
      "id": "nl1",
      "type": "hero",
      "title": "Newsletter Archive",
      "content": "Browse past issues of the Westwood Community Band newsletter.",
      "imageUrl": "/images/band-hero.jpg"
    },
    {
      "id": "nl2",
      "type": "downloads",
      "title": "Past Issues",
      "content": "",
      "downloadGroups": [
        {
          "title": "2014 \u2013 2015",
          "items": [
            {"label":"Jan 22, 2015","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]},
            {"label":"Nov 20, 2014","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Oct 30, 2014","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Sep 11, 2014","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]}
          ]
        },
        {
          "title": "2013 \u2013 2014",
          "items": [
            {"label":"Jan 30, 2014","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]},
            {"label":"Nov 07, 2013","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Sep 19, 2013","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]}
          ]
        },
        {
          "title": "2012 \u2013 2013",
          "items": [
            {"label":"Jan 17, 2013","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Oct 18, 2012","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Sep 20, 2012","links":[{"label":"Page 1","url":"#"}]}
          ]
        },
        {
          "title": "2011 \u2013 2012",
          "items": [
            {"label":"Nov 17, 2011","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Oct 20, 2011","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]}
          ]
        },
        {
          "title": "2010 \u2013 2011",
          "items": [
            {"label":"Jan 27, 2011","links":[{"label":"Page 1","url":"#"}]}
          ]
        },
        {
          "title": "2009 \u2013 2010",
          "items": [
            {"label":"Nov 26, 2009","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]},
            {"label":"Sep 17, 2009","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]}
          ]
        },
        {
          "title": "2008 \u2013 2009",
          "items": [
            {"label":"May 07, 2009","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Jan 29, 2009","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Nov 20, 2008","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Oct 30, 2008","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]}
          ]
        },
        {
          "title": "2007 \u2013 2008",
          "items": [
            {"label":"May 22, 2008","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Jan 10, 2008","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Nov 22, 2007","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Nov 01, 2007","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Oct 04, 2007","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]}
          ]
        },
        {
          "title": "2006 \u2013 2007",
          "items": [
            {"label":"May 03, 2007","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Jan 11, 2007","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]},
            {"label":"Nov 23, 2006","links":[{"label":"Page 1","url":"#"}]},
            {"label":"Nov 02, 2006","links":[{"label":"Page 1","url":"#"},{"label":"Page 2","url":"#"}]}
          ]
        }
      ]
    }
  ]'::jsonb,
  true,
  3,
  'Newsletter'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  layout = EXCLUDED.layout,
  sidebar_width = EXCLUDED.sidebar_width,
  sections = EXCLUDED.sections,
  show_in_nav = EXCLUDED.show_in_nav,
  nav_order = EXCLUDED.nav_order,
  nav_label = EXCLUDED.nav_label;
