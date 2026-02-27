-- Replace the schedule section on the Performances page with a structured performances section
-- containing example performance items.

UPDATE pages
SET sections = '[
  {
    "id": "p1",
    "type": "hero",
    "title": "Upcoming Performances",
    "content": "Join us at our upcoming concerts and events throughout the 2024/25 season.",
    "imageUrl": "/images/performance.jpg"
  },
  {
    "id": "p2",
    "type": "performances",
    "title": "Concert Schedule",
    "content": "",
    "performanceItems": [
      {
        "id": "perf-1",
        "date": "March 15, 2025",
        "title": "Spring Concert",
        "venue": "John Taylor Collegiate",
        "time": "7:00 PM",
        "description": "Join us for an evening of classic and contemporary concert band music."
      },
      {
        "id": "perf-2",
        "date": "May 20, 2025",
        "title": "Community Showcase",
        "venue": "Assiniboine Park Bandstand",
        "time": "2:00 PM",
        "description": "A free outdoor performance for the whole community."
      },
      {
        "id": "perf-3",
        "date": "June 12, 2025",
        "title": "Season Finale",
        "venue": "John Taylor Collegiate",
        "time": "7:00 PM",
        "description": "Celebrate the end of our 2024/25 season with a grand finale concert."
      },
      {
        "id": "perf-4",
        "date": "December 14, 2024",
        "title": "Holiday Concert",
        "venue": "John Taylor Collegiate",
        "time": "7:00 PM",
        "description": "Our annual holiday concert featuring seasonal favourites and festive classics."
      },
      {
        "id": "perf-5",
        "date": "October 26, 2024",
        "title": "Fall Harvest Concert",
        "venue": "Cmakeill Community Centre",
        "time": "2:00 PM",
        "description": "An afternoon of autumnal tunes and classic marches."
      }
    ]
  }
]'::jsonb
WHERE id = 'performances';
