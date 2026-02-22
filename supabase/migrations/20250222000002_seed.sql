-- Seed default site_settings and pages (from src/constants.ts)
-- Only runs if tables are empty so re-running migrations is safe.

INSERT INTO site_settings (id, band_name, logo_url, primary_color, secondary_color, footer_text)
VALUES (
  1,
  'Westwood Community Band',
  '/treble-clef.svg',
  '#991b1b',
  '#1e3a8a',
  '© 2026 Westwood Community Band. Forty-five Years of Making Music.'
)
ON CONFLICT (id) DO NOTHING;

-- Seed initial pages (home + a few key pages). Full content matches INITIAL_PAGES in constants.ts.
INSERT INTO pages (id, title, slug, layout, sidebar_width, sections, show_in_nav, nav_order, nav_label) VALUES
('home', 'Home', '/', 'full', 25, '[
  {"id":"h1","type":"hero","title":"Forty-five Years of Making Music","content":"The Westwood Community Band is based in Winnipeg, Manitoba, Canada. Since 1980, we have been bringing quality music to our local community.","imageUrl":"/images/band-hero.jpg"},
  {"id":"h2","type":"text","title":"Our History","content":"In 1980, the band director of Sansome School challenged the parents of his band students to form their own group, with the purpose of leading by example. A number of these parents responded and their on-going dedication, boosted by a steady input of new members, has blossomed into the Westwood Community Band. Some of those original parents are still enthusiastic members!"},
  {"id":"h3","type":"text","title":"Our Mission","content":"The Band''s objectives are to play good music and offer musical entertainment to the wider community. The Band welcomes adults, beginners through to accomplished musicians, who play woodwind, brass, or percussion instruments. We practice from September – June, Thursday nights at John Taylor Collegiate."},
  {"id":"h4","type":"text","title":"Join Us","content":"This is a friendly environment. New members are welcome to sit in for a couple of nights with no commitment necessary. You will soon feel at home! If you are considering joining us or if you would like to book Westwood Community Band to play at an event, please contact us."}
]'::jsonb, true, 0, NULL),
('performances', 'Performances 2024/25', '/performances', 'full', 25, '[
  {"id":"p1","type":"hero","title":"Upcoming Performances","content":"Join us at our upcoming concerts and events throughout the 2024/25 season.","imageUrl":"/images/performance.jpg"},
  {"id":"p2","type":"schedule","title":"Concert Schedule","content":"Check back regularly for updates to our performance schedule. We perform at various venues across Winnipeg and surrounding areas."}
]'::jsonb, true, 1, 'Performances'),
('media', 'Media', '/media', 'full', 25, '[
  {"id":"m1","type":"hero","title":"Videos & Recordings","content":"Watch and listen to performances by the Westwood Community Band.","imageUrl":"/images/media.jpg"},
  {"id":"m2","type":"text","title":"Featured Recordings","content":"Liberty Bell • Big Band Showcase • It Don''t Mean a Thing • Count Basie Salute • Themes Like Old Times • Caravan • Swing the Mood • Blues Brothers Revue"}
]'::jsonb, true, 2, NULL),
('photos', 'Photos', '/photos', 'full', 25, '[
  {"id":"ph1","type":"hero","title":"Photo Gallery","content":"Browse photos from our concerts, rehearsals, and special events over the years.","imageUrl":"/images/photos.jpg"},
  {"id":"ph2","type":"gallery","title":"Event Photos","content":"2014 Christmas Bus Trip • 2013 Forks Concert • 2013 Spring Concert with Stonewall Collegiate Jazz Band • 2012 Benefit for the Canadian Mental Health Association • 2011 An Old Fashioned Christmas Concert • 2006/2007 Rehearsal • 2006 Christmas Concert at Rockwood ANAF • 2006 International Music Camp • 2006 June – Year End Concert at the Forks"}
]'::jsonb, true, 3, NULL),
('join', 'Join Us', '/join', 'sidebar-right', 35, '[
  {"id":"j1","type":"text","title":"Welcome New Members","content":"The Band welcomes adults, beginners through to accomplished musicians, who play woodwind, brass, or percussion instruments. This is a friendly environment, and new members are welcome to sit-in for a couple of nights with no commitment necessary. You will soon feel at home!"},
  {"id":"j2","type":"text","title":"Rehearsals","content":"Thursday Evenings, 7:15 to 9:15 p.m.\n\nThe Band Room\nJohn Taylor Collegiate\n470 Hamilton Avenue\nWinnipeg, Manitoba"},
  {"id":"j3","type":"text","title":"Membership","content":"The Band averages 40+ members from all parts of Winnipeg and from all walks of life: ages range from 18 to 80+.\n\nBand Season is from September to June.\nAnnual fee $100.00\nStudents $50.00\nWestwood Community Band Polo Shirt $15.00"},
  {"id":"j4","type":"image-text","title":"Musical Director","content":"Virginia Helmer was a music teacher in the Pembina Trails School Division for 38 years, working with students from grades 5-9. She has been a member of the Winnipeg Wind Ensemble since 1986, has guest conducted the group on several occasions and was appointed Artistic Director in 2020. She conducted the Manitoba Junior Provincial Honour Band in 2019 and the Intermediate Honour Band in 2024. Ginny has been the music director of the Westwood Community Band since 2017.\n\nGinny holds a Bachelor''s degree in Music Performance from the University of Western Ontario, and a Masters'' Degree in Education from the University of Manitoba. She has participated in conducting workshops with Glenn Price, Craig Kirchoff and Eugene Corporan, and successfully completed the Canadian Wind Conductors'' Development Program.","imageUrl":"/images/director.jpg"}
]'::jsonb, true, 4, NULL),
('contact', 'Contact', '/contact', 'sidebar-right', 40, '[
  {"id":"c1","type":"contact","title":"Contact the Band","content":"If you have questions about the band, use the form to contact us!"},
  {"id":"c2","type":"text","title":"Executive Committee","content":"President: Duncan Hasker\nMusical Director: Ginny Helmer\nVice President: Sherry Aubin\nSecretary: Doug Gibb\nTreasurer: David Patrick\nPast President: Greg McLean\nLibrarian: Mikaila Hardy\nGigs: Greg Barratt\nGigs: Ray Vance\nSocial Rep: Wendy Chapman\nSocial Rep: Shelley Greaves"}
]'::jsonb, true, 5, NULL)
ON CONFLICT (id) DO NOTHING;

-- Join and Contact pages need sidebar_blocks
UPDATE pages SET sidebar_blocks = '[{"id":"sb-rehearsals","type":"rehearsals","order":0},{"id":"sb-fees","type":"fees","order":1},{"id":"sb-contact","type":"contact","order":2}]'::jsonb
WHERE id IN ('join', 'contact');
