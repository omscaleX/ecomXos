import { redirect } from "next/navigation";

/** /shopify is an alias for the Sales page. */
export default function ShopifyPage() {
  redirect("/sales");
}
