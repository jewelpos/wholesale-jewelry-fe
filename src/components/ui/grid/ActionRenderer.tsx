import { ICellRendererParams } from "ag-grid-community";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { Eye, Edit2, Trash2, Edit } from "react-feather";

export interface ActionCellRendererParams<T = any> extends ICellRendererParams {
  onEdit?: (data: T) => void;
  onDelete?: (data: T) => void;
  onView?: (data: T) => void;
  editPath?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const ActionCellRenderer = <T extends unknown>({
  data,
  onEdit,
  onDelete,
  onView,
  editPath,
}: ActionCellRendererParams<T>) => {
  const router = useRouter();

  const handleEdit = () => {
    if (editPath) {
      router.push(`${editPath}/${data.id}`);
    } else if (onEdit) {
      onEdit(data);
    }
  };

  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>

        {onView && (
          <Link
            className="me-2 p-2"
            href="#"
            onClick={() => onView(data)}
            scroll={false}
          >
            <Eye className="feather-view" />
          </Link>
        )}

        {(onEdit || editPath) && (
          <Link
            className="me-2 p-2"
            href="#"
            onClick={handleEdit}
            scroll={false}
          >
            <Edit className="feather-edit" />
          </Link>
        )}

        {onDelete && (
          <Link
            className="confirm-text p-2"
            href="#"
            onClick={() => onDelete(data)}
            scroll={false}
          >
            <Trash2 className="feather-trash-2" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ActionCellRenderer;
