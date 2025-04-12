export const filterVariables = (params: any) => {
  const { startRow, endRow, filterModel, sortModel } = params.request;

  const filters = Object.keys(filterModel).map((item, key) => ({
    key: item,
    value: filterModel[item],
  }));

  const perpage = endRow - startRow;
  const page = Math.floor(startRow / perpage) + 1;
  return { perpage, page, filters, sortModel };
};
