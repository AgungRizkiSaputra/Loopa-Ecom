export const siteConfig = {
  name: "loopa",
  shortName: "loopa",
  brandName: "loopa",
  tagline: "Style Goes Around.",
  description:
    "A playful, modern C2C everyday fashion marketplace where personal style circulates through discovery, direct chat, and authentic visual reviews.",
  currency: {
    symbol: "Rp",
    code: "IDR",
    locale: "id-ID",
  },
  colors: {
    lime: "#D9F36A",
    lavender: "#A99AF7",
    coral: "#FF876F",
    cream: "#F7F3EC",
    charcoal: "#242424",
  },
  contact: {
    supportEmail: "hello@loopa.fashion",
    instagram: "@loopa.style",
  },
  navItems: [
    { label: "Discover", href: "/", icon: "Sparkles" },
    { label: "Explore", href: "/explore", icon: "Compass" },
    { label: "Chat", href: "/chat", icon: "MessageSquare", badgeKey: "unreadMessages" },
    { label: "Orders", href: "/orders", icon: "Package" },
    { label: "Studio", href: "/dashboard", icon: "Store", sellerOnly: true },
  ],
  categories: [
    "All Pieces",
    "Vintage Archive",
    "Knit & Crochet",
    "Streetwear & Denim",
    "Footwear & Tabi",
    "Y2K Accessories",
    "Artisan Apparel",
  ],
};

export type SiteConfig = typeof siteConfig;
