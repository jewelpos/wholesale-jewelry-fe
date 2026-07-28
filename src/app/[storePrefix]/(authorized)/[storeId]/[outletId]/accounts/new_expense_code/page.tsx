"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const NewExpenseCodeRedirect = () => {
  const { storePrefix, storeId, outletId } = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/${storePrefix}/${storeId}/${outletId}/settings/system_settings/expense_codes`);
  }, [storePrefix, storeId, outletId, router]);
  return null;
};

export default NewExpenseCodeRedirect;
