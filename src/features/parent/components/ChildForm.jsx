import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarBlank, FloppyDisk, UserCircle } from "@phosphor-icons/react";
import { ApiError } from "../../../lib/api/errors";

function validateChildValues(values) {
  const errors = {};
  const displayName = values.displayName?.trim() || "";
  if (!displayName) errors.displayName = "Nhập tên hiển thị cho bé.";
  else if (displayName.length > 40) errors.displayName = "Tên bé tối đa 40 ký tự.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthDate || "")) errors.birthDate = "Chọn ngày sinh hợp lệ.";
  if (!["seed", "rabbit"].includes(values.avatar)) errors.avatar = "Chọn một hình đại diện.";
  return errors;
}

const avatarOptions = [
  { value: "seed", label: "Mầm xanh", src: "/images/seed.webp" },
  { value: "rabbit", label: "Thỏ nhỏ", src: "/images/rabbit.webp" },
];

export default function ChildForm({
  mode = "create",
  initialValues,
  isSaving = false,
  serverError,
  onSubmit,
  onCancel,
}) {
  const emptyValues = { displayName: "", birthDate: "", avatar: "seed" };
  const initialKey = JSON.stringify(initialValues || emptyValues);
  const [values, setValues] = useState(initialValues || emptyValues);
  const [clientErrors, setClientErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    function confirmLeave(event) {
      if (JSON.stringify(values) !== initialKey) event.preventDefault();
    }
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [initialKey, values]);

  const serverApiError = serverError instanceof ApiError ? serverError : null;
  const serverFieldErrors = serverApiError?.fieldErrors || {};
  const errors = { ...clientErrors, ...serverFieldErrors };
  const dirty = JSON.stringify(values) !== initialKey;
  function updateValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setTouched((current) => ({ ...current, [name]: true }));
    setClientErrors((current) => ({ ...current, [name]: undefined }));
  }
  function submit(values) {
    const validationErrors = validateChildValues(values);
    setTouched({ displayName: true, birthDate: true, avatar: true });
    setClientErrors(validationErrors);
    if (!Object.keys(validationErrors).length) onSubmit({ ...values, displayName: values.displayName.trim() });
  }

  return (
    <form className="parent-form" onSubmit={(event) => { event.preventDefault(); submit(values); }} noValidate>
      {serverError && (
        <div className="parent-form-alert" role="alert">
          <strong>{serverApiError?.code === "CHILD_QUOTA_EXCEEDED" ? "Đã đạt giới hạn hồ sơ" : "Chưa thể lưu hồ sơ"}</strong>
          <p>{serverError.message || "Kiểm tra lại thông tin và thử lại."}</p>
        </div>
      )}
      <div className="parent-form-grid">
        <div className="parent-form-main">
          <div className="parent-form-section-heading">
            <span className="parent-form-icon"><UserCircle size={20} aria-hidden="true" /></span>
            <div><h2>Thông tin cơ bản</h2><p>Những điều cần thiết để cá nhân hóa hành trình đọc.</p></div>
          </div>
          <div className="parent-field">
            <label htmlFor="child-display-name">Tên hiển thị <span>*</span></label>
            <input
              id="child-display-name"
              placeholder="Ví dụ: Mây"
              value={values.displayName}
              onChange={(event) => updateValue("displayName", event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, displayName: true }))}
              aria-invalid={Boolean(touched.displayName && errors.displayName)}
              aria-describedby={touched.displayName && errors.displayName ? "child-display-name-error" : undefined}
            />
            {touched.displayName && errors.displayName && (
              <p id="child-display-name-error" className="parent-field-error">
                {errors.displayName}
              </p>
            )}
          </div>
          <div className="parent-field">
            <label htmlFor="child-birth-date">Ngày sinh <span>*</span></label>
            <div className="parent-input-with-icon">
              <CalendarBlank size={19} aria-hidden="true" />
              <input
                id="child-birth-date"
                type="date"
                value={values.birthDate}
                onChange={(event) => updateValue("birthDate", event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, birthDate: true }))}
                aria-invalid={Boolean(touched.birthDate && errors.birthDate)}
                aria-describedby={touched.birthDate && errors.birthDate ? "child-birth-date-error" : undefined}
              />
            </div>
            {touched.birthDate && errors.birthDate && (
              <p id="child-birth-date-error" className="parent-field-error">
                {errors.birthDate}
              </p>
            )}
          </div>
          <fieldset className="parent-field parent-avatar-field">
            <legend>Hình đại diện</legend>
            <div className="parent-avatar-options">
              {avatarOptions.map((avatar) => (
                <label className="parent-avatar-option" key={avatar.value}>
                  <input type="radio" name="avatar" value={avatar.value} checked={values.avatar === avatar.value} onChange={(event) => updateValue("avatar", event.target.value)} />
                  <span><img src={avatar.src} alt="" width="55" height="55" /><strong>{avatar.label}</strong></span>
                </label>
              ))}
            </div>
            {touched.avatar && errors.avatar && <p className="parent-field-error">{errors.avatar}</p>}
          </fieldset>
        </div>
        <aside className="parent-form-aside">
          <div className="parent-form-note">
            <span>Gợi ý nhỏ</span>
            <p>Tên hiển thị có thể là biệt danh mà bé yêu thích. Bạn có thể cập nhật lại bất cứ lúc nào.</p>
          </div>
          <p className="parent-required-note"><span>*</span> Trường bắt buộc</p>
        </aside>
      </div>
      <div className="parent-form-actions">
        <Link className="workspace-button workspace-button-quiet" to={onCancel || "/parent/children"} onClick={(event) => { if (dirty && !window.confirm("Bạn có thay đổi chưa lưu. Rời trang?")) event.preventDefault(); }}>
          <ArrowLeft size={17} aria-hidden="true" /> Hủy
        </Link>
        <button className="workspace-button" type="submit" disabled={isSaving}>
          <FloppyDisk size={17} aria-hidden="true" /> {isSaving ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : "Tạo hồ sơ bé"}
        </button>
      </div>
    </form>
  );
}
