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
    return "";
  };