import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import ChildForm from "../components/ChildForm";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import "../parent.css";

export default function NewChildPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const entitlementQuery = useQuery({ queryKey: queryKeys.entitlement(user.id), queryFn: () => childrenService.entitlement() });
  const mutation = useMutation({
    mutationFn: childrenService.create,
    onSuccess: async (child) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.children(user.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlement(user.id) }),
      ]);
      navigate(`/parent/children/${child.id}`);
    },
  });

  if (entitlementQuery.isLoading) return <LoadingState label="Đang kiểm tra hạn mức hồ sơ" />;
  if (entitlementQuery.isError) return <ErrorState title="Chưa thể kiểm tra hạn mức" message={entitlementQuery.error.message} onRetry={() => entitlementQuery.refetch()} />;
  const entitlement = entitlementQuery.data;
  const atLimit = entitlement.childProfileLimit !== null && entitlement.usedChildProfiles >= entitlement.childProfileLimit;

  return <div className="parent-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">PHỤ HUYNH / HỒ SƠ BÉ</p><h1>Thêm một người kể chuyện</h1><p>Tạo không gian riêng cho những câu chuyện được viết từ trí tưởng tượng của bé.</p></div></div>{atLimit ? <div className="parent-limit-card"><h2>Gói {entitlement.plan} đã đạt giới hạn</h2><p>Máy chủ demo đang trả về {entitlement.usedChildProfiles}/{entitlement.childProfileLimit} hồ sơ. Hãy kiểm tra gói và hạn mức trước khi tạo thêm.</p><Link className="workspace-button workspace-button-quiet" to="/parent/plan">Xem gói sử dụng</Link></div> : <ChildForm isSaving={mutation.isPending} serverError={mutation.error} onSubmit={mutation.mutate} onCancel="/parent/children" />}</div>;
}
