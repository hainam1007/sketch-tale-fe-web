import { profileIndex } from "../services/profilePresentation";
import { Cat, Dog, Rabbit, Bird, Star, Flower } from "@phosphor-icons/react";
const icons = [Cat, Rabbit, Dog, Bird, Star, Flower];
export default function ChildAvatar({ id, index, size = 30 }) {
  const variant = index ?? profileIndex(id);
  const Icon = icons[variant % icons.length];
  return (
    <span className={`family-avatar family-avatar-${variant % icons.length}`}>
      <Icon size={size} weight="duotone" aria-hidden="true" />
    </span>
  );
}
