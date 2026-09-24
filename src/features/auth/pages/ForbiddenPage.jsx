import { ArrowLeft, ShieldWarning } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return <div className="container not-found"><ShieldWarning size={54} aria-hidden="true" /><p className="eyebrow">403 / KHÔNG ĐỦ QUYỀN</p><h1>Khu vực này không dành cho phiên hiện tại.</h1><p>Quyền truy cập được xác định bởi tài khoản và server, không phải chỉ bởi đường dẫn.</p><Link className="button" to="/"><ArrowLeft size={18} aria-hidden="true" /> Về trang chủ</Link></div>;
}
