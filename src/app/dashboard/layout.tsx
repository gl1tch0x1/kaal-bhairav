import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050b14]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-5 relative">
          {/* Subtle background grid */}
          <div
            className="fixed inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(8,145,178,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(220,38,38,0.03) 0%, transparent 50%)",
            }}
          />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
