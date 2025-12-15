"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile page (which now has all the settings)
    if (status !== "loading") {
      router.push("/profile");
    }
  }, [status, router]);

  return null;
}
