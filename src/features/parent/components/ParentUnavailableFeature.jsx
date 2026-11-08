import { Link } from "react-router-dom";

export default function ParentUnavailableFeature({ title }) {
  return <div className="parent-page family-workspace">
    <section className="family-panel" role="status">
      <h1>{title}</h1>
      <p>Tính năng này đang được hoàn thiện và chưa khả dụng.</p>
      <Link className="workspace-button" to="/parent/children">Về hồ sơ bé</Link>
    </section>
  </div>;
}
