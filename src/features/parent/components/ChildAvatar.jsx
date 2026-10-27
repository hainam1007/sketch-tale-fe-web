import { profileIndex } from "../services/profilePresentation";
import { childAvatars } from "../services/childAvatarLibrary";
export default function ChildAvatar({ id, index, size = 30 }) {
  const variant = Number.isInteger(index) && index >= 0 ? index : profileIndex(id);
  const avatar = childAvatars[variant % childAvatars.length];
  return (
    <span className="family-avatar family-avatar-image">
      <img src={avatar.src} alt="" width={size * 2} height={size * 2} decoding="async" />
    </span>
  );
}
