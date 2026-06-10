import { useEffect, useState } from "react";

const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

async function fetchTrending(categoryId, count = 5) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&videoCategoryId=${categoryId}&maxResults=${count}&regionCode=US&key=${YT_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.items || []).map((item) => ({
    id: item.id,
    thumb: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
  }));
}

export default function GlobeMosaic() {
  const [rows, setRows] = useState([[], []]);

  useEffect(() => {
    if (!YT_KEY) return;
    Promise.all([
      fetchTrending(25, 5), // News & Politics
      fetchTrending(10, 5), // Music
    ])
      .then(([news, music]) => setRows([news, music]))
      .catch(() => {});
  }, []);

  if (!rows[0].length && !rows[1].length) return null;

  return (
    <div className="globe-mosaic" aria-hidden="true">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className={`globe-mosaic-row globe-mosaic-row-${rowIdx + 1}`}>
          {[...row, ...row].map((img, i) => (
            <div key={`${img.id}-${i}`} className="globe-mosaic-cell">
              <img src={img.thumb} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
