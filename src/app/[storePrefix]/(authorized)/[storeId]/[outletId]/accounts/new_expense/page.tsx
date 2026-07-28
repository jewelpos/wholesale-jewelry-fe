"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const NewExpenseRedirect = () => {
  const { storePrefix, storeId, outletId } = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/${storePrefix}/${storeId}/${outletId}/accounts/expense_list`);
  }, [storePrefix, storeId, outletId, router]);
  return null;
};

export default NewExpenseRedirect;
