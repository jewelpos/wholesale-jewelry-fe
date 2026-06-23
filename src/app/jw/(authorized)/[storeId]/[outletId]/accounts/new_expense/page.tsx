"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const NewExpenseRedirect = () => {
  const { storeId, outletId } = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/jw/${storeId}/${outletId}/accounts/expense_list`);
  }, [storeId, outletId, router]);
  return null;
};

export default NewExpenseRedirect;
