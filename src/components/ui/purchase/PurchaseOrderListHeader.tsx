import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import Link from "next/link";
import PageHeader from "../PageHeader";
import FeatherIcon from "../FeatherIcon";

export default function PurchaseOrderListHeader({
  selectedPOs,
  handleExport,
}: {
  selectedPOs: number[];
  handleExport: (ids: number[], type: string) => void;
}) {
  const { currentMenu, currentPath } = useMenu();

  const handleAction = (actionName: string) => {
    if (actionName.includes("print")) {
      handleExport(selectedPOs, "print");
    } else if (actionName.includes("export")) {
      handleExport(selectedPOs, "export");
    }
  };

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div className="d-flex purchase-pg-btn">
        {!!currentMenu?.action.length &&
          [...currentMenu.action]
            .sort((a: MenuAction, b: MenuAction) => {
              if (a.actionorder < b.actionorder) return -1;
              if (a.actionorder > b.actionorder) return 1;
              return 0;
            })
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);
              const isModalButton =
                btn.actionname.includes("print") ||
                btn.actionname.includes("export");
              const disabledButton =
                !selectedPOs.length &&
                (btn.actionname.includes("print") ||
                  btn.actionname.includes("export"));
              return (
                <div
                  className="page-btn d-none d-sm-block"
                  key={btn.actionname}
                >
                  <Link
                    href={isModalButton ? "#" : `${currentPath}/new`}
                    onClick={() =>
                      isModalButton ? handleAction(btn.actionname) : null
                    }
                    className={`btn btn-added ${btnColor} ${
                      disabledButton ? "disabled" : ""
                    }`}
                  >
                    {iconName && <FeatherIcon icon={iconName} />}
                    {btn.actiondisplayname}
                  </Link>
                </div>
              );
            })}
      </div>
    </PageHeader>
  );
}
