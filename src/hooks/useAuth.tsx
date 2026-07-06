import { useAppDispatch } from "@/lib/store/hook";
import { clearUser } from "@/lib/store/slice/userDataSlice";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams<{ storePrefix?: string }>();
  const storePrefix = params?.storePrefix ?? "jw";

  const onLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!data.ok) {
        throw new Error("Logout failed");
      }
      dispatch(clearUser());
      router.push(`/${storePrefix}/login`);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    onLogout,
    loading,
  };
};

export default useAuth;
