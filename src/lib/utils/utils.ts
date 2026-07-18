export const renderActionButtonColor = (actionName: string) => {
    if (actionName.includes("add")) {
      return "btn-primary";
    }
    if (actionName.includes("print")) {
      return "btn-secondary";
    }
    if (actionName.includes("export")) {
      return "btn-info";
    }
    if (actionName.includes("email")) {
      return "btn-warning";
    }
    if (actionName.includes("outlet_matrix")) {
      return "btn-info";
    }
    return "btn-dark";
  };

  export const renderActionButtonIconName = (actionName: string) => {
    if (actionName.includes("add")) {
      return "plus-circle";
    }
    if (actionName.includes("print")) {
      return "printer";
    }
    if (actionName.includes("export")) {
      return "upload";
    }
    if (actionName.includes("email")) {
      return "mail";
    }
    if (actionName.includes("outlet_matrix")) {
      return "grid";
    }
    if (actionName.includes("sales_matrix")) {
      return "bar-chart-2";
    }
    if (actionName.includes("matrix")) {
      return "grid";
    }
    return "zap";
  };

  export const renderActionButtonUrl = (actionName: string, basePath: string) => {
    if (actionName.includes("outlet_matrix")) {
      return `${basePath}/inventory_pivot`;
    }
    return `${basePath}/new`;
  };


  // Allow only numbers (and a single dot) in the "amount" field
  export const handleKeyDownAllowNumberOnly = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Backspace",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Delete",
      "Home",
      "End",
    ];

    if (
      !/[0-9]/.test(e.key) &&
      !(e.key === "." && !e.currentTarget.value.includes(".")) &&
      !allowedKeys.includes(e.key)
    ) {
      e.preventDefault();
    }
  };