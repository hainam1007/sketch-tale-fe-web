import { ArrowLeft, UserCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { roleLabels } from "../../../lib/permissions/roles";

export default function ProfilePage() {
  const { user } = useAuth();
  const home = user.role === "parent" ? "/parent" : user.role === "admin" ? "/admin" : "/content";
  return (
    <div className="workspace-profile-page">
      <div className="workspace-page-heading"><div><p className="workspace-eyebrow">TÀI KHOẢN</p><h1>Hồ sơ của bạn</h1><p>Thông tin tài khoản đang đăng nhập trong phiên demo.</p></div></div>
      <section className="workspace-profile-card"><div className="workspace-profile-avatar"><UserCircle size={55} weight="duotone" aria-hidden="true" /></div><div><span className="workspace-eyebrow">{roleLabels[user.role]}</span><h2>{user.name}</h2><p>{user.email}</p></div></section>
      <Link to={home} className="parent-text-link"><ArrowLeft size={17} aria-hidden="true" /> Quay về workspace</Link>
    </div>
  );
}
