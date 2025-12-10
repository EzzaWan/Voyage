import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function useIsAdmin() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    // Check if user is admin via API (checks database first, then env vars)
    const checkAdmin = async () => {
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${apiUrl}/admin/check?email=${encodeURIComponent(userEmail)}`);

        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin === true);
        } else {
          // Fallback to env var check if API fails
          const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          setIsAdmin(adminEmails.includes(userEmail.toLowerCase()));
        }
      } catch (error) {
        // Fallback to env var check on error
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
        setIsAdmin(userEmail ? adminEmails.includes(userEmail) : false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, isLoaded]);

  return { isAdmin, loading };
}



