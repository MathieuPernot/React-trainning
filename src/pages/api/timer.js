export default function handler(req, res) {
  const target = new Date("2025-07-18T19:00:00Z").getTime();
  const now = Date.now();
  const finished = now >= target;
  const timeLeft = Math.max(target - now, 0);

  res.status(200).json({ finished, timeLeft });
}
