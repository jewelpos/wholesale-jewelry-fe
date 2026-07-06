import { CatalogTile } from "@/types/home";

const sharedTiles: CatalogTile[] = [
  {
    icon: "/assets/img/gif/user.gif",
    title: "Your team",
    para: "1 admin account was created with your store. Add team members and set their access levels.",
    btnText: "View & manage users",
    btnUrl: "/users",
    setupFlag: "hassetupusers",
  },
  {
    icon: "/assets/img/gif/receipt.gif",
    title: "Choose your invoice layout",
    para: "Pick how your invoices and documents look when printed or emailed to customers.",
    btnText: "Choose layout",
    btnUrl: "/invoice-layout",
    setupFlag: "hassetuplayout",
  },
  {
    icon: "/assets/img/gif/tax.gif",
    title: "Organize your sales taxes",
    para: "Set up tax rates so your invoices and reports stay accurate.",
    btnText: "Set up sales taxes",
    btnUrl: "#",
    setupFlag: "hassetupsalestax",
    comingSoon: true,
  },
  {
    icon: "/assets/img/gif/ready.gif",
    title: "Ready to get started?",
    para: "Head to your dashboard to see how your business is performing at a glance.",
    btnText: "Go to dashboard",
    btnUrl: "/dashboard/admin",
  },
];

const branchTile: CatalogTile = {
  icon: "/assets/img/gif/outlet.gif",
  title: "Add a branch outlet",
  para: "Want to expand? Add a new location to [StoreName]. Branches share the same product catalog and team.",
  btnText: "Add branch",
  btnUrl: "/outlet/create",
  optional: true,
};

const wholesaleUserTiles: CatalogTile[] = [
  {
    icon: "/assets/img/gif/store.gif",
    title: "Add your suppliers",
    para: "Add the vendors and suppliers you source products from before building your product catalog.",
    btnText: "Add suppliers",
    btnUrl: "/supplier/new",
  },
  {
    icon: "/assets/img/gif/user.gif",
    title: "Set up customer accounts",
    para: "Create B2B customer accounts with credit terms, limits, and contact details.",
    btnText: "Add customers",
    btnUrl: "/customers/new",
  },
];

const jewelryWholesaleTiles: CatalogTile[] = [
  {
    icon: "/assets/img/gif/products.gif",
    title: "Configure categories",
    para: "Set up your product departments and lines — including metal types, stone categories, and jewelry styles.",
    btnText: "Configure categories",
    btnUrl: "/products/categories",
  },
  {
    icon: "/assets/img/gif/inventory.gif",
    title: "Add your jewelry catalog",
    para: "Build your product catalog with stone details, metal types, carat weight, and pricing. Link each item to a supplier.",
    btnText: "Add products",
    btnUrl: "/products/new",
    setupFlag: "hassetupproduct",
  },
];

const generalWholesaleTiles: CatalogTile[] = [
  {
    icon: "/assets/img/gif/products.gif",
    title: "Configure categories",
    para: "Organize your products into departments and product lines before adding inventory.",
    btnText: "Configure categories",
    btnUrl: "/products/categories",
  },
  {
    icon: "/assets/img/gif/inventory.gif",
    title: "Add your product catalog",
    para: "Build your product catalog and link each item to a supplier. Inventory quantities can be added later.",
    btnText: "Add products",
    btnUrl: "/products/new",
    setupFlag: "hassetupproduct",
  },
];

const jewelryRetailTiles: CatalogTile[] = [
  {
    icon: "/assets/img/gif/products.gif",
    title: "Configure categories",
    para: "Set up departments and product lines — metal types, stone categories, and jewelry styles.",
    btnText: "Configure categories",
    btnUrl: "/products/categories",
  },
  {
    icon: "/assets/img/gif/inventory.gif",
    title: "Add your jewelry catalog",
    para: "Build your product catalog with stone details, metal types, and pricing.",
    btnText: "Add products",
    btnUrl: "/products/new",
    setupFlag: "hassetupproduct",
  },
  {
    icon: "/assets/img/gif/receipt.gif",
    title: "Customize your receipts",
    para: "Choose what information appears on customer receipts and how it's displayed.",
    btnText: "Customize receipts",
    btnUrl: "#",
    setupFlag: "hassetupreceipt",
    comingSoon: true,
  },
];

const generalRetailTiles: CatalogTile[] = [
  {
    icon: "/assets/img/gif/products.gif",
    title: "Configure categories",
    para: "Organize your products into departments and product lines before adding inventory.",
    btnText: "Configure categories",
    btnUrl: "/products/categories",
  },
  {
    icon: "/assets/img/gif/inventory.gif",
    title: "Add your product catalog",
    para: "Build your product catalog with descriptions, pricing, and inventory levels.",
    btnText: "Add products",
    btnUrl: "/products/new",
    setupFlag: "hassetupproduct",
  },
  {
    icon: "/assets/img/gif/receipt.gif",
    title: "Customize your receipts",
    para: "Choose what information appears on customer receipts and how it's displayed.",
    btnText: "Customize receipts",
    btnUrl: "#",
    setupFlag: "hassetupreceipt",
    comingSoon: true,
  },
];

const buildTiles = (coreTiles: CatalogTile[], includeWholesale = false): CatalogTile[] => {
  const [userTile, ...rest] = sharedTiles;
  const wholesaleExtra = includeWholesale ? wholesaleUserTiles : [];
  return [userTile, ...wholesaleExtra, ...coreTiles, ...rest.slice(0, -1), branchTile, rest[rest.length - 1]];
};

export const catalogByStoreType: Record<string, CatalogTile[]> = {
  "Jewelry Wholesale": buildTiles(jewelryWholesaleTiles, true),
  "General Merchandise Wholesale": buildTiles(generalWholesaleTiles, true),
  "Jewelry Retail": buildTiles(jewelryRetailTiles, false),
  "General Merchandise Retail": buildTiles(generalRetailTiles, false),
};

export const defaultCatalog: CatalogTile[] = buildTiles(generalWholesaleTiles, false);
