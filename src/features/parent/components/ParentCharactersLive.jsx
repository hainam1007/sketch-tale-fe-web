import { Palette } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import { parentApprovalService } from "../services/parentApprovalService";

const statusNames = ["Bản xem trước", "Chờ duyệt", "Đã duyệt", "Đã từ chối", "Đã ẩn"];

function statusLabel(value) {
  if (Number.isInteger(value)) return statusNames[value] ?? "Chưa rõ trạng thái";
  return statusNames.find((name) => name.toLowerCase() === String(value ?? "").toLowerCase())
    ?? ({ preview: statusNames[0], pending: statusNames[1], approved: statusNames[2], rejected: statusNames[3] })[String(value ?? "").toLowerCase()]
    ?? "Chưa rõ trạng thái";
}

export default function ParentCharactersLive({ child, userId }) {
  const query = useQuery({
    queryKey: ["parent-child-characters", userId, child.id],
    queryFn: ({ signal }) => parentApprovalService.listCharactersForChild({ childId: child.id, signal }),
  });

  return (
    <section className="family-panel parent-character-gallery" aria-labelledby="parent-character-gallery-title">
      <div className="family-section-heading">
        <div>
          <p className="workspace-eyebrow">NHÂN VẬT CỦA BÉ</p>
          <h2 id="parent-character-gallery-title">Nhân vật của {child.nickName || child.displayName}</h2>
          <p>Những nhân vật bé đã tạo, gồm cả nhân vật đang chờ duyệt.</p>
        </div>
        {query.isSuccess && <span className="parent-character-count">{query.data.length} nhân vật</span>}
      </div>
      {query.isPending ? <LoadingState label="Đang tải nhân vật của bé" />
        : query.isError ? <ErrorState title="Chưa tải được nhân vật" message={query.error.message} onRetry={() => query.refetch()} />
          : query.data.length === 0 ? <EmptyState icon={Palette} title="Bé chưa có nhân vật" message="Nhân vật bé tạo sẽ xuất hiện tại đây." />
            : <div className="parent-character-grid">
              {query.data.map((character) => (
                <article className="parent-character-tile" key={character.id}>
                  <div className="parent-character-image">
                    {character.characterImageUrl || character.originalDrawingImageUrl
                      ? <img src={character.characterImageUrl || character.originalDrawingImageUrl} alt={`Nhân vật ${character.characterName || "chưa đặt tên"}`} loading="lazy" />
                      : <Palette size={36} aria-hidden="true" />}
                  </div>
                  <div className="parent-character-copy">
                    <h3>{character.characterName || "Nhân vật chưa đặt tên"}</h3>
                    <span>{statusLabel(character.parentApprovalStatus)}</span>
                  </div>
                </article>
              ))}
            </div>}
    </section>
  );
}
