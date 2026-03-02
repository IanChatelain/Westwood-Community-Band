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
    "title": "Photos, Recordings & Videos",
    "content": "Browse photos from our concerts, listen to recordings, and watch videos of the Westwood Community Band.",
    "imageUrl": "/images/media.jpg"
  },
  {"id":"m2-photos","type":"gallery","title":"Photos","content":"","tabGroup":"media","tabLabel":"Photos","galleryEvents":[]},
  {"id":"m2-recordings","type":"audio-playlist","title":"Recordings","content":"","tabGroup":"media","tabLabel":"Recordings","audioItems":[]},
  {"id":"m2-videos","type":"video-gallery","title":"Videos","content":"","tabGroup":"media","tabLabel":"Videos","videoItems":[]},
  {
    "id": "m3",
    "type": "text",
    "title": "International Music Camp",
    "content": "The <a href=\"http://www.internationalmusiccamp.com/\" target=\"_blank\" rel=\"noopener noreferrer\">International Music Camp</a> is an annual event for students and adults that takes place at the International Peace Gardens on the border between Manitoba and North Dakota.\n\nThe adult camp is a 4-day event. Every year a significant number of Westwood Band members make the trek to attend. In 2006, Westwood were guest performers at IMC for our 25th anniversary. We loved performing for such an amazing audience."
  },
  {
    "id": "m4",
    "type": "downloads",
    "title": "Band Documents",
    "content": "Download band resources including the complete music library listing.",
    "downloadItems": []
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
