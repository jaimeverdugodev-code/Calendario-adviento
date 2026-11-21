export const YO_AVATARS = [
  'public/avatars/yo1.png',
  'public/avatars/yo2.png',
  'public/avatars/yo3.png',
];

export function getMyAvatarForDay(day) {
  const n = Number(day);
  const idx = (Number.isFinite(n) ? Math.abs(Math.floor(n) - 1) : 0) % YO_AVATARS.length;
  return YO_AVATARS[idx];
}
