import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

interface TooltipComponentProps {
  value: string;
  children: React.ReactElement;
}

const TooltipComponent: React.FC<TooltipComponentProps> = ({
  value,
  children,
}) => (
  <OverlayTrigger
    placement="top"
    overlay={<Tooltip id="tooltip">{value}</Tooltip>}
  >
    {children}
  </OverlayTrigger>
);

export default TooltipComponent;
