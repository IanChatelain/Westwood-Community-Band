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
    "title": "Videos & Recordings",
    "content": "Watch and listen to performances by the Westwood Community Band.",
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
      {
        "id": "m-liberty-bell",
        "title": "Liberty Bell",
        "slug": "liberty-bell",
        "description": "A classic march by John Philip Sousa.",
        "media": []
      },
      {
        "id": "m-big-band-showcase",
        "title": "Big Band Showcase",
        "slug": "big-band-showcase",
        "description": "Highlights from our big band repertoire.",
        "media": []
      },
      {
        "id": "m-it-dont-mean-a-thing",
        "title": "It Don''t Mean a Thing",
        "slug": "it-dont-mean-a-thing",
        "description": "Duke Ellington''s iconic swing number.",
        "media": []
      },
      {
        "id": "m-count-basie-salute",
        "title": "Count Basie Salute",
        "slug": "count-basie-salute",
        "description": "A tribute to the legendary Count Basie.",
        "media": []
      },
      {
        "id": "m-themes-like-old-times",
        "title": "Themes Like Old Times",
        "slug": "themes-like-old-times",
        "description": "A nostalgic medley of timeless melodies.",
        "media": []
      },
      {
        "id": "m-caravan",
        "title": "Caravan",
        "slug": "caravan",
        "description": "The classic Duke Ellington and Juan Tizol composition.",
        "media": []
      },
      {
        "id": "m-swing-the-mood",
        "title": "Swing the Mood",
        "slug": "swing-the-mood",
        "description": "An energetic swing medley.",
        "media": []
      },
      {
        "id": "m-blues-brothers-revue",
        "title": "Blues Brothers Revue",
        "slug": "blues-brothers-revue",
        "description": "A rockin'' tribute to the Blues Brothers.",
        "media": []
      }
    ]
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
