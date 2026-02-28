const url = process.argv[2];
const res = await fetch(url);
const html = await res.text();
const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
console.log(JSON.stringify(imgs, null, 2));
