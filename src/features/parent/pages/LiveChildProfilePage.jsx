import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";
import { useAuth } from "../../auth/useAuth";
import { parentProfileService } from "../services/parentProfileService";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import "../parent-overview.css";

export default function LiveChildProfilePage({ childId }) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["parent-live-profile", user.id, childId],
    queryFn: ({ signal }) => parentProfileService.get({ childId, signal }),
  });
  if (query.isPending) return <LoadingState label="Đang mở hồ sơ bé" />;
  if (query.isError)
    return (
      <div className="parent-page">
        <Link to="/parent/children">← Về hồ sơ bé</Link>
        <ErrorState
          title="Chưa mở được hồ sơ"
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  return <ProfileEditor key={childId} child={query.data} userId={user.id} />;
}

function ProfileEditor({ child, userId }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const confirm = useConfirmToast();
  const initial = {
    nickName: child.nickName,
    dailyTimeLimit: child.dailyTimeLimit ?? "",
    dailyCharacterLimit: child.dailyCharacterLimit ?? "",
  };
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState("");
  const dirty = JSON.stringify(saved) !== JSON.stringify(values);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  const mutation = useMutation({
    mutationFn: parentProfileService.update,
    onSuccess: async (_, submitted) => {
      setSaved({
        nickName: submitted.nickName,
        dailyTimeLimit: submitted.dailyTimeLimit ?? "",
        dailyCharacterLimit: submitted.dailyCharacterLimit ?? "",
      });
      setValues({
        nickName: submitted.nickName,
        dailyTimeLimit: submitted.dailyTimeLimit ?? "",
        dailyCharacterLimit: submitted.dailyCharacterLimit ?? "",
      });
      setMessage("Đã lưu hồ sơ và giới hạn sử dụng của bé.");
      await Promise.all([
        client.invalidateQueries({
          queryKey: ["parent-live-profiles", userId],
        }),
        client.invalidateQueries({
          queryKey: ["parent-live-profile", userId, child.id],
        }),
      ]);
    },
  });
  function change(event) {
    const { name, value, type } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "number" && value !== "" ? Number(value) : value,
    }));
    setMessage("");
    mutation.reset();
  }
  return (
    <div className="parent-page parent-entry-page">
      <Link
        to="/parent/children"
        onClick={async (event) => {
          if (!dirty) return;
          event.preventDefault();
          if (
            await confirm({
              title: "Rời hồ sơ bé?",
              message: "Thay đổi của bạn chưa được lưu. Bạn có muốn rời trang?",
              confirmLabel: "Rời trang",
              tone: "danger",
            })
          )
            navigate("/parent/children");
        }}
      >
        ← Về hồ sơ bé
      </Link>
      <header className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">HỒ SƠ VÀ THÓI QUEN</p>
          <h1>Đồng hành cùng {child.nickName}</h1>
          <p>Điều chỉnh thông tin và giới hạn hằng ngày cho riêng bé.</p>
        </div>
      </header>
      <form
        className="parent-pending-panel parent-live-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!values.nickName.trim() || mutation.isPending) return;
          mutation.mutate({
            childId: child.id,
            nickName: values.nickName.trim(),
            dailyTimeLimit:
              values.dailyTimeLimit === "" ? null : values.dailyTimeLimit,
            dailyCharacterLimit:
              values.dailyCharacterLimit === ""
                ? null
                : values.dailyCharacterLimit,
          });
        }}
      >
        <h2>Thông tin và giới hạn sử dụng</h2>
        <fieldset disabled={mutation.isPending}>
          <label>
            Tên hiển thị của bé
            <input
              name="nickName"
              required
              maxLength={60}
              pattern=".*\S.*"
              value={values.nickName}
              onChange={change}
            />
          </label>
          <div className="parent-live-fields">
            <label>
              Thời gian sử dụng mỗi ngày (phút)
              <input
                name="dailyTimeLimit"
                type="number"
                min="0"
                max="2147483647"
                step="1"
                value={values.dailyTimeLimit}
                onChange={change}
              />
            </label>
            <label>
              Số nhân vật mỗi ngày
              <input
                name="dailyCharacterLimit"
                type="number"
                min="0"
                max="2147483647"
                step="1"
                value={values.dailyCharacterLimit}
                onChange={change}
              />
            </label>
          </div>
          <p className="parent-live-note">
            Ô trống nghĩa là chưa có giá trị cấu hình. Giới hạn được áp dụng
            theo quy tắc của hệ thống.
          </p>
        </fieldset>
        {mutation.isError && (
          <p role="alert" className="parent-form-alert">
            {mutation.error.message}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <div className="parent-form-actions">
          <span>
            {dirty ? "Bạn có thay đổi chưa lưu" : "Thông tin hồ sơ hiện tại"}
          </span>
          <button
            className="workspace-button workspace-button-quiet"
            type="button"
            disabled={!dirty || mutation.isPending}
            onClick={() => {
              setValues(saved);
              setMessage("");
              mutation.reset();
            }}
          >
            Hoàn tác
          </button>
          <button
            className="workspace-button"
            type="submit"
            disabled={!dirty || mutation.isPending}
          >
            {mutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
