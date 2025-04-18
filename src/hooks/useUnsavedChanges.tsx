import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface UseUnsavedChangesProps {
  isDirty: boolean;
  onCancel?: () => void;
}

const useUnsavedChanges = ({ isDirty, onCancel }: UseUnsavedChangesProps) => {
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = ""; // Show browser warning
      }
    };

    const handleBackNavigation = (event: PopStateEvent) => {
      // if (isDirty) {
      //   event.preventDefault();
      //   showConfirmation(() => router.back());
      //   router.replace(window.location.pathname); // Prevent navigation
      // }
    };

    // window.addEventListener("beforeunload", handleBeforeUnload);
    // window.addEventListener("popstate", handleBackNavigation);

    // return () => {
    //   window.removeEventListener("beforeunload", handleBeforeUnload);
    //   window.removeEventListener("popstate", handleBackNavigation);
    // };
  }, [isDirty, router]);

  const showConfirmation = (onConfirm: () => void) => {
    MySwal.fire({
      title: "Unsaved Changes",
      text: "You have unsaved changes. Do you really want to leave?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, leave",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm();
      }
    });
  };

  const handleCancel = () => {
    // if (isDirty) {
    //   showConfirmation(() => {
    //     onCancel?.();
    //   });
    // } else {
    //   onCancel?.();
    // }
  };

  return { handleCancel };
};

export default useUnsavedChanges;
