import { CheckCircle, Plus, UserCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../../auth/authService";
import "../parent.css";

const emptyCredentials = { username: "", password: "", nickName: "" };

export default function NewChildPage() {
  const [credentials, setCredentials] = useState(emptyCredentials);
  const [createdAccount, setCreatedAccount] = useState(null);
  const accountMutation = useMutation({
    mutationFn: authService.registerChildAccount,
    retry: false,
    onSuccess: (_response, submitted) => {
      setCreatedAccount({
        displayName: submitted.nickName.trim(),
        username: submitted.username.trim(),
      });
      setCredentials((current) => ({ ...current, password: "" }));
    },
  });

  function submit(event) {
    event.preventDefault();
    if (createdAccount || accountMutation.isPending) return;
    accountMutation.mutate(credentials);
  }

  function startAnotherAccount() {
    setCreatedAccount(null);
    setCredentials(emptyCredentials);
    accountMutation.reset();
  }

  return (
    <div className="parent-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / HỒ SƠ BÉ</p>
          <h1>Tạo tài khoản cho bé</h1>
          <p>Mỗi bé có tài khoản riêng để bắt đầu hành trình đọc của mình.</p>
        </div>
      </div>

      {createdAccount ? (
        <section className="parent-account-success" role="status" aria-labelledby="child-account-success-title">
          <div className="parent-account-success-heading">
            <CheckCircle size={23} weight="fill" aria-hidden="true" />
            <div>
              <h2 id="child-account-success-title">Tài khoản của {createdAccount.displayName} đã sẵn sàng</h2>
              <p>Bé có thể đăng nhập bằng tên tài khoản bên dưới.</p>
            </div>
          </div>
          <div className="parent-account-username"><span>Tên đăng nhập</span><strong>{createdAccount.username}</strong></div>
          <div className="parent-form-actions">
            <Link className="workspace-button workspace-button-quiet" to="/parent">Về tổng quan</Link>
            <button className="workspace-button" type="button" onClick={startAnotherAccount}><Plus size={17} aria-hidden="true" /> Thêm tài khoản bé khác</button>
          </div>
        </section>
      ) : (
        <section className="parent-account-create-card" aria-labelledby="child-account-title">
          <div className="parent-form-section-heading">
            <span className="parent-form-icon"><UserCircle size={20} aria-hidden="true" /></span>
            <div>
              <h2 id="child-account-title">Thông tin đăng nhập</h2>
              <p>Chọn tên tài khoản và tên hiển thị mà bé sẽ dùng.</p>
            </div>
          </div>
          <form className="parent-form" onSubmit={submit}>
            <div className="parent-form-grid">
              <div className="parent-form-main">
                <div className="parent-field">
                  <label htmlFor="child-account-username">Tên đăng nhập <span>*</span></label>
                  <input id="child-account-username" autoComplete="username" required value={credentials.username} onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))} />
                </div>
                <div className="parent-field">
                  <label htmlFor="child-account-password">Mật khẩu <span>*</span></label>
                  <input id="child-account-password" type="password" autoComplete="new-password" required value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} />
                </div>
                <div className="parent-field">
                  <label htmlFor="child-account-nickname">Tên hiển thị <span>*</span></label>
                  <input id="child-account-nickname" maxLength={60} required value={credentials.nickName} onChange={(event) => setCredentials((current) => ({ ...current, nickName: event.target.value }))} />
                </div>
              </div>
              <aside className="parent-form-aside">
                <div className="parent-form-note">
                  <span>Gợi ý cho phụ huynh</span>
                  <p>Chọn tên đăng nhập bé dễ nhớ và giữ mật khẩu để hỗ trợ bé khi cần.</p>
                </div>
              </aside>
            </div>
            {accountMutation.isError && <div className="parent-form-alert" role="alert"><strong>Chưa thể tạo tài khoản</strong><p>{accountMutation.error.message || "Kiểm tra lại thông tin và thử lại."}</p></div>}
            <div className="parent-form-actions">
              <Link className="workspace-button workspace-button-quiet" to="/parent/children">Hủy</Link>
              <button className="workspace-button" type="submit" disabled={accountMutation.isPending}>{accountMutation.isPending ? "Đang tạo tài khoản…" : "Tạo tài khoản bé"}</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
