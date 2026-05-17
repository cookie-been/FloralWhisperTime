import type { SiteConfig } from "@/types";

export function buildAdminLoginBackgroundSlides(siteConfig: SiteConfig | null) {
  return (
    siteConfig?.adminLoginSlides?.length
      ? siteConfig.adminLoginSlides
      : [
          siteConfig?.heroImage,
          "/admin-login/florist-counter.jpg",
          "/admin-login/floral-arrangement.jpg",
          "/admin-login/bouquet-display.jpg",
        ]
  ).filter((item): item is string => Boolean(item));
}

export function buildAdminLoginCopy(siteConfig: SiteConfig | null) {
  return {
    brandLogo: siteConfig?.brandLogo || "/brand-logo.png",
    brandName: siteConfig?.brandName ?? "花语时光",
  };
}
