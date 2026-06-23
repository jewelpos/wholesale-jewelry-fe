"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const NewExpenseCodeRedirect = () => {
  const { storeId, outletId } = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/jw/${storeId}/${outletId}/settings/system_settings/expense_codes`);
  }, [storeId, outletId, router]);
  return null;
};

export default NewExpenseCodeRedirect;
