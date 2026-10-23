import { ApiError, api } from "./api";
import { createClient } from "./supabase/client";

// Typed client for /api/admin (backend/src/routes/admin). Money is in paise.

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  scale: string | null;
  series: string | null;
  material: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  isTrending: boolean;
  createdAt: string;
  variantId: string | null;
  sku: string | null;
  stockQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  available: number;
  images: { id: string; url: string }[];
  collections: { id: string; slug: string; name: string }[];
};

export type ProductInput = {
  name: string;
  brand: string;
  scale: string;
  series: string;
  material: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  isTrending: boolean;
  collectionIds: string[];
};

export type AdminCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};

export type OrderRow = {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  itemCount: number;
};

export type OrderDetail = OrderRow & {
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  trackingNumber: string | null;
  courier: string | null;
  notes: string | null;
  reservedUntil: string | null;
  updatedAt: string;
  items: {
    id: string;
    productName: string;
    sku: string;
    unitPrice: number;
    qty: number;
    lineTotal: number;
    slug: string | null;
    image: string | null;
  }[];
  history: {
    id: string;
    from: string | null;
    to: string;
    note: string | null;
    createdAt: string;
    by: string | null;
  }[];
  nextStatuses: string[];
};

export type Stats = {
  stats: {
    periodRevenue: number;
    totalRevenue: number;
    periodOrders: number;
    toFulfil: number;
    awaitingPayment: number;
    customers: number;
    activeProducts: number;
    lowStockCount: number;
  };
  series: { date: string; revenue: number; orders: number }[];
  byStatus: { status: string; count: number }[];
  recent: {
    id: string;
    orderNumber: string;
    customer: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  top: { name: string; units: number; revenue: number }[];
  lowStock: { id: string; name: string; available: number; image: string | null }[];
  topCustomers: { name: string; email: string; orders: number; spend: number }[];
};

export type Customer = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: "customer" | "admin";
  createdAt: string;
  orders: number;
  spend: number;
};

export type Movement = {
  id: string;
  change: number;
  reason: string;
  note: string | null;
  createdAt: string;
  orderNumber: string | null;
  by: string | null;
};

type Paged<T> = { items: T[]; total: number; pages: number };

const a = <T>(path: string, init?: Parameters<typeof api>[1]) =>
  api<T>(`/admin${path}`, { ...init, auth: true });
const qs = (params: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
  return p.size ? `?${p}` : "";
};

export const adminApi = {
  stats: (days: number) => a<Stats>(`/stats?days=${days}`),

  products: (p: {
    q?: string;
    collection?: string;
    status?: string;
    stock?: string;
    page?: number;
  }) => a<Paged<AdminProduct>>(`/products${qs(p)}`),
  product: (id: string) => a<AdminProduct>(`/products/${id}`),
  movements: (id: string) => a<Movement[]>(`/products/${id}/movements`),
  createProduct: (body: ProductInput) => a<AdminProduct>("/products", { method: "POST", body }),
  updateProduct: (id: string, body: Partial<ProductInput>) =>
    a<AdminProduct>(`/products/${id}`, { method: "PATCH", body }),
  deleteProduct: (id: string) =>
    a<{ archived: boolean; message: string }>(`/products/${id}`, { method: "DELETE" }),
  setCover: (id: string, imageId: string) =>
    a<AdminProduct>(`/products/${id}/images/${imageId}/cover`, { method: "POST" }),
  deleteImage: (id: string, imageId: string) =>
    a<AdminProduct>(`/products/${id}/images/${imageId}`, { method: "DELETE" }),
  /** Raw image body (the API stores it in Supabase Storage). */
  async uploadImage(id: string, file: File, cover = false) {
    const { data } = await createClient().auth.getSession();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/admin/products/${id}/images${cover ? "?cover=1" : ""}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: file,
      },
    );
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, json?.error ?? "Upload failed");
    return json as AdminProduct;
  },

  collections: () => a<AdminCollection[]>("/collections"),
  createCollection: (body: Omit<AdminCollection, "id" | "slug" | "productCount">) =>
    a<{ id: string }>("/collections", { method: "POST", body }),
  updateCollection: (id: string, body: Omit<AdminCollection, "id" | "slug" | "productCount">) =>
    a<{ id: string }>(`/collections/${id}`, { method: "PATCH", body }),
  deleteCollection: (id: string) => a(`/collections/${id}`, { method: "DELETE" }),

  orders: (p: { status?: string; q?: string; page?: number }) =>
    a<Paged<OrderRow>>(`/orders${qs(p)}`),
  order: (id: string) => a<OrderDetail>(`/orders/${id}`),
  setOrderStatus: (
    id: string,
    body: { status: string; trackingNumber?: string; courier?: string },
  ) => a(`/orders/${id}/status`, { method: "PATCH", body }),

  customers: (q?: string) => a<Customer[]>(`/customers${qs({ q })}`),
  setRole: (id: string, role: Customer["role"]) =>
    a(`/customers/${id}`, { method: "PATCH", body: { role } }),
};
