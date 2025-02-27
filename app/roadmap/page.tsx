import { Suspense } from "react";
import RoadMap from "./roadmap"

export default function PublicProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoadMap />
    </Suspense>
  );
}
