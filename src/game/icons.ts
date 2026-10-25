import {
  BookOpen,
  Bomb,
  Briefcase,
  Car,
  Clapperboard,
  CloudRain,
  Coffee,
  Egg,
  Gift,
  Snowflake,
  Sun,
  Crown,
  Drama,
  Flame,
  Gamepad2,
  Gem,
  Ghost,
  Globe,
  HeartPulse,
  Heart,
  Landmark,
  Layers,
  MapPin,
  Music,
  PawPrint,
  Pizza,
  Puzzle,
  Rocket,
  ScrollText,
  Shirt,
  Shuffle,
  Skull,
  Smartphone,
  Sofa,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { Season } from './season'

/** Small icon on the home screen logo during a season. */
export const SEASON_BADGE: Record<Season, LucideIcon> = {
  halloween: Ghost,
  christmas: Snowflake,
  easter: Egg,
  summer: Sun,
}

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: Pizza,
  animals: PawPrint,
  sports: Trophy,
  places: MapPin,
  tech: Smartphone,
  entertainment: Clapperboard,
  household: Sofa,
  nature: CloudRain,
  music: Music,
  jobs: Briefcase,
  vehicles: Car,
  clothing: Shirt,
  body: HeartPulse,
  myth: Sparkles,
  halloween: Ghost,
  christmas: Gift,
  easter: Egg,
  summer: Sun,
  tricky: Shuffle,
  tyrants: Crown,
  darkhumor: Skull,
  prophets: ScrollText,
  stereotypes: Drama,
  races: Globe,
  infamous: Landmark,
  terror: Bomb,
  religions: BookOpen,
}

/** Icons a custom word list can pick from. Keys are what gets persisted. */
export const LIST_ICONS: Record<string, LucideIcon> = {
  layers: Layers,
  star: Star,
  heart: Heart,
  zap: Zap,
  flame: Flame,
  gem: Gem,
  puzzle: Puzzle,
  target: Target,
  ghost: Ghost,
  rocket: Rocket,
  coffee: Coffee,
  gamepad: Gamepad2,
}

export const DEFAULT_LIST_ICON = 'layers'

export function isListIcon(key: string | undefined): key is string {
  return !!key && key in LIST_ICONS
}

/** Icon for any category id: built-in id, or `custom:<id>` with the list's icon key. */
export function iconFor(categoryId: string, listIcon?: string): LucideIcon {
  if (CATEGORY_ICONS[categoryId]) return CATEGORY_ICONS[categoryId]
  return LIST_ICONS[listIcon ?? ''] ?? LIST_ICONS[DEFAULT_LIST_ICON]
}
