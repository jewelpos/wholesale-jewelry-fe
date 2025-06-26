import React from "react";
import { UsersListType } from "@/types/user";
import Link from "next/link";
import { Edit } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";

interface UserActionsProps {
  data: UsersListType;
}

const UserActions: React.FC<UserActionsProps> = ({ data }) => {
  const { basePath } = useDefaultRoute();

  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        <Link
          className="me-2 p-2"
          href={`${basePath}/users/${data.userid}/edit`}
          scroll={false}
        >
          <Edit className="feather-edit" />
        </Link>
      </div>
    </div>
  );
};

export default UserActions;
