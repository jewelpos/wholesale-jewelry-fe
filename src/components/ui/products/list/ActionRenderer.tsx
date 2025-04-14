import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { Eye, Edit2, Trash2 } from "react-feather";

const ActionCellRenderer = (props: {
  data: any;
  // Define the type of data if possible
  // For example: data: ProductListType;
}) => {
  const { data } = props;

  const handleView = () => {
    console.log("View clicked:", data);
    // your logic here
  };

  const handleEdit = () => {
    console.log("Edit clicked:", data);
    // your logic here
  };

  const handleDelete = () => {
    console.log("Delete clicked:", data);
    // your logic here
  };

  return (
    <ButtonGroup size="sm" className="d-flex justify-content-center">
      <Button variant="outline-light" onClick={handleView}>
        <Eye stroke="blue" size={20} />
      </Button>
      <Button variant="outline-light" onClick={handleEdit}>
        <Edit2 size={20} />
      </Button>
      <Button variant="outline-light" onClick={handleDelete}>
        <Trash2 stroke="red" size={20} />
      </Button>
    </ButtonGroup>
  );
};

export default ActionCellRenderer;
