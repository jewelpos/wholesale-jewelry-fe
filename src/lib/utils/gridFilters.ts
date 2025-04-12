export const filterVariables = (params: any) => {
  const { startRow, endRow, filterModel } = params.request;

  const filters = Object.keys(filterModel).reduce((acc, key) => {
    acc[key] = filterModel[key].filter;
    return acc;
  }, {} as any);

  const perpage = endRow - startRow;
  const page = Math.floor(startRow / perpage) + 1;
  return { perpage, page };
};
