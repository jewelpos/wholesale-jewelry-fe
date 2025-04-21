import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface ConfirmationDialogOptions {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: "warning" | "error" | "success" | "info" | "question";
}

/**
 * Shows a confirmation dialog using SweetAlert2
 * @param options Configuration options for the dialog
 * @returns Promise that resolves to the result of the dialog
 */
export const showConfirmationDialog = async (
  options: ConfirmationDialogOptions = {}
) => {
  const {
    title = "Are you sure?",
    text = "You won't be able to revert this!",
    confirmButtonText = "Yes, proceed!",
    cancelButtonText = "Cancel",
    icon = "warning",
  } = options;

  return await MySwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });
};

export default showConfirmationDialog;
