import { Store } from "./store";

export type CatalogTile = {
  icon: string;
  title: string;
  para: string;        // may contain [StoreName] placeholder
  btnText: string;
  btnUrl: string;      // relative to basePath
  setupFlag?: keyof Store;
  comingSoon?: boolean;
  optional?: boolean;  // shown with visual distinction
};
