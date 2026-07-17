import LoginPage from "@/components/auth/LoginPage";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
