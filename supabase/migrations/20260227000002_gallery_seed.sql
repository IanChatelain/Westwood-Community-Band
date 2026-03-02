-- Populate the Media and Photos pages with styled CMS galleries.
-- Each recording title from the Media page becomes a GalleryEvent.
-- The Photos page gets representative concert/event gallery entries.
-- Media items (images/videos) are left empty — upload via the CMS admin UI.

-- ============================================================
-- Media page: convert m2 from text to gallery section
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
]'::jsonb,
    updated_at = now()
WHERE id = 'media';

-- ============================================================
-- Photos page: populate ph2 gallery with concert/event entries
-- ============================================================
UPDATE pages
SET sections = '[
  {
    "id": "ph1",
    "type": "hero",
    "title": "Photo Gallery",
    "content": "Browse photos from our concerts, rehearsals, and special events over the years.",
    "imageUrl": "/images/photos.jpg"
  },
  {
    "id": "ph2",
    "type": "gallery",
    "title": "Event Photos",
    "content": "",
    "galleryColumns": 3,
    "galleryCardSize": "md",
    "galleryThumbnailAspect": "landscape",
    "galleryShowDescription": true,
    "galleryEvents": [
      {
        "id": "ph-spring-2025",
        "title": "Spring Concert 2025",
        "slug": "spring-concert-2025",
        "description": "Photos from our Spring 2025 concert.",
        "media": []
      },
      {
        "id": "ph-holiday-2024",
        "title": "Holiday Concert 2024",
        "slug": "holiday-concert-2024",
        "description": "Festive moments from our Holiday 2024 concert.",
        "media": []
      },
      {
        "id": "ph-spring-2024",
        "title": "Spring Concert 2024",
        "slug": "spring-concert-2024",
        "description": "Highlights from our Spring 2024 performance.",
        "media": []
      },
      {
        "id": "ph-holiday-2023",
        "title": "Holiday Concert 2023",
        "slug": "holiday-concert-2023",
        "description": "Scenes from our Holiday 2023 concert.",
        "media": []
      },
      {
        "id": "ph-rehearsals",
        "title": "Rehearsals",
        "slug": "rehearsals",
        "description": "Behind the scenes at our Thursday night rehearsals.",
        "media": []
      },
      {
        "id": "ph-community-events",
        "title": "Community Events",
        "slug": "community-events",
        "description": "The band out and about in the community.",
        "media": []
      }
    ]
  }
]'::jsonb,
    updated_at = now()
WHERE id = 'photos';
