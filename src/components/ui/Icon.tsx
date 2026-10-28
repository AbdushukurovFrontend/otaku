import {
  BookOpen,
  Castle,
  Clapperboard,
  Coffee,
  Crown,
  Drama,
  FlaskConical,
  Flame,
  Gamepad2,
  Ghost,
  Hash,
  Heart,
  Library,
  Lightbulb,
  ListMusic,
  MessagesSquare,
  MountainSnow,
  Palette,
  PenTool,
  Popcorn,
  Radio,
  Rocket,
  Sparkles,
  Swords,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

export const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Castle,
  Clapperboard,
  Coffee,
  Crown,
  Drama,
  FlaskConical,
  Flame,
  Gamepad2,
  Ghost,
  Hash,
  Heart,
  Library,
  Lightbulb,
  ListMusic,
  MessagesSquare,
  MountainSnow,
  Palette,
  PenTool,
  Popcorn,
  Radio,
  Rocket,
  Sparkles,
  Swords,
};

/** Icons offered when a user opens a new Hub. */
export const HUB_ICON_CHOICES = ['Sparkles', 'Swords', 'Gamepad2', 'ListMusic', 'Ghost', 'Popcorn', 'Coffee', 'Rocket', 'Heart', 'BookOpen'];

export function DynIcon({ name, ...props }: { name?: string } & LucideProps) {
  const C = (name && ICONS[name]) || Hash;
  return <C {...props} />;
}
