"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, clearAuth } from "@/lib/auth";
import toast from "react-hot-toast";

export default function IdleLogoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not authenticated, do not start idle listeners
    if (!isAuthenticated()) return;

    let timeoutId: NodeJS.Timeout;

    const handleTimeout = () => {
      clearAuth();
      toast("Sesi berakhir karena tidak ada aktivitas selama 5 menit.", {
        icon: "⏰",
        duration: 5000,
        id: "idle-timeout",
      });
      router.push("/login");
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 5 minutes = 5 * 60 * 1000 ms
      timeoutId = setTimeout(handleTimeout, 5 * 60 * 1000);
    };

    // User activity events to listen to
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    // Initialize timer
    resetTimer();

    // Bind event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname, router]);

  return <>{children}</>;
}
