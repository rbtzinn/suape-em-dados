import { redirect } from "next/navigation";

import { getSession } from "@/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { getSystemSnapshot } from "@/data/system";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const [session, snapshot] = await Promise.all([getSession(), getSystemSnapshot()]);
  if (!session) redirect("/login");
  return <AppShell session={session} meta={snapshot.meta}>{children}</AppShell>;
}
