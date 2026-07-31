import { useEffect } from "react";

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  url?: string;
  price?: number;
  currency?: string;
  availability?: string;
}

export default function MetaTags({
  title,
  description,
  image,
  type = "website",
  url,
  price,
  currency = "AUD",
  availability,
}: MetaTagsProps) {
  const siteTitle = "Pacifika Wear";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDesc = "Authentic Pacific Island clothing. Handcrafted island dresses, shirts, family sets, and kids wear delivered Australia-wide.";
  const desc = description || defaultDesc;
  const img = image || "/pwa-192x192.png";
  const pageUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    // Basic meta
    document.title = fullTitle;
    setMeta("description", desc);

    // Open Graph
    setMetaOg("og:title", fullTitle);
    setMetaOg("og:description", desc);
    setMetaOg("og:image", img);
    setMetaOg("og:type", type);
    setMetaOg("og:url", pageUrl);
    setMetaOg("og:site_name", siteTitle);

    // Twitter
    setMetaOg("twitter:card", "summary_large_image");
    setMetaOg("twitter:title", fullTitle);
    setMetaOg("twitter:description", desc);
    setMetaOg("twitter:image", img);

    // Product structured data
    if (type === "product" && price) {
      setMetaOg("product:price:amount", String(price));
      setMetaOg("product:price:currency", currency);
      if (availability) {
        setMetaOg("product:availability", availability);
      }
    }

    return () => {
      document.title = siteTitle;
    };
  }, [fullTitle, desc, img, type, pageUrl, price, currency, availability]);

  return null;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaOg(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}
