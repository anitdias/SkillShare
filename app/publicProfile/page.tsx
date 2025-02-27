import { Suspense } from "react";
import ProfilePage from "./publicProfile"

export default function PublicProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePage />
    </Suspense>
  );
}
