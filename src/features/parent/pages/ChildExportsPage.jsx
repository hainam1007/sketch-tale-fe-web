import { Navigate, useParams } from "react-router-dom";

export default function ChildExportsPage() {
  const { childId } = useParams();
  return (
    <Navigate
      to={`/parent/children/${encodeURIComponent(childId)}/library`}
      replace
    />
  );
}
