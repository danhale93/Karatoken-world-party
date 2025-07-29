// Utility for fetching and syncing lyrics for karaoke
// This is a stub. Replace with real API integration as needed.

export async function fetchLyricsForYoutube(youtubeUrl: string): Promise<{ lines: { time: number, text: string }[] }> {
  // Example: call a backend endpoint or lyrics API
  const res = await fetch('http://localhost:3000/api/lyrics/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ youtubeUrl }),
  });
  if (!res.ok) throw new Error('Failed to fetch lyrics');
  return await res.json();
}

export function getCurrentLyricLine(lines: { time: number, text: string }[], currentTime: number): string {
  // Find the latest lyric line for the current playback time
  let last = '';
  for (const line of lines) {
    if (currentTime >= line.time) last = line.text;
    else break;
  }
  return last;
}
