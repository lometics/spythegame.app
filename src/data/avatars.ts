// Avatar pool — DiceBear "lorelei" SVGs (CC0) downloaded into public/avatars/.
export const AVATARS: string[] = Array.from(
  { length: 12 },
  (_, i) => `${import.meta.env.BASE_URL}avatars/avatar-${i + 1}.svg`,
)

export function avatarForIndex(i: number): string {
  return AVATARS[((i % AVATARS.length) + AVATARS.length) % AVATARS.length]
}

export function nextAvatar(current: string | undefined): string {
  const idx = current ? AVATARS.indexOf(current) : -1
  return AVATARS[(idx + 1) % AVATARS.length]
}
