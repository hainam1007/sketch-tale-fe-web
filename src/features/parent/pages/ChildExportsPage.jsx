import { useParams } from "react-router-dom";
import ParentExportsPage from "./ParentExportsPage";

export default function ChildExportsPage() {
  const { childId } = useParams();
  return <ParentExportsPage fixedChildId={childId} key={childId} />;
}
