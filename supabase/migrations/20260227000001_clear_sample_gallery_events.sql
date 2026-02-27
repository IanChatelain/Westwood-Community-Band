-- Clear sample gallery events from the photos page.
-- Only targets pages still carrying the original seeded event IDs (ge-1 through ge-9)
-- to avoid wiping user-curated content.

UPDATE pages
SET sections = (
  SELECT jsonb_agg(
    CASE
      WHEN (elem->>'type') = 'gallery'
        AND elem->'galleryEvents' IS NOT NULL
        AND (
          SELECT bool_and(ev->>'id' LIKE 'ge-%')
          FROM jsonb_array_elements(elem->'galleryEvents') AS ev
        )
      THEN jsonb_set(elem, '{galleryEvents}', '[]'::jsonb)
      ELSE elem
    END
    ORDER BY idx
  )
  FROM jsonb_array_elements(sections) WITH ORDINALITY AS t(elem, idx)
)
WHERE id = 'photos';
