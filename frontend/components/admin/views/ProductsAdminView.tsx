"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  Card,
  Drawer,
  PageHead,
  Skeleton,
  Spinner,
  StatusBadge,
  StockBadge,
  Toggle,
  btn,
  dateTime,
  errorMessage,
  inputClass,
  labelClass,
  toast,
} from "@/components/admin/ui";
import {
  type AdminCollection,
  type AdminProduct,
  type ProductInput,
  adminApi,
} from "@/lib/admin-api";
import { cn, formatPrice } from "@/lib/utils";

// Form values (prices in rupees as typed); converted to paise for the API.
type Form = {
  name: string;
  brand: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  lowStockThreshold: string;
  scale: string;
  series: string;
  material: string;
  description: string;
  collectionIds: string[];
  visible: boolean;
  isFeatured: boolean;
  isTrending: boolean;
};

const EMPTY: Form = {
  name: "",
  brand: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  lowStockThreshold: "3",
  scale: "1:64",
  series: "",
  material: "Die-cast metal with plastic parts",
  description: "",
  collectionIds: [],
  visible: true,
  isFeatured: false,
  isTrending: false,
};

const toForm = (p: AdminProduct): Form => ({
  name: p.name,
  brand: p.brand ?? "",
  sku: p.sku ?? "",
  price: String(p.price / 100),
  compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice / 100) : "",
  stock: String(p.stockQty),
  lowStockThreshold: String(p.lowStockThreshold),
  scale: p.scale ?? "",
  series: p.series ?? "",
  material: p.material ?? "",
  description: p.description ?? "",
  collectionIds: p.collections.map((c) => c.id),
  visible: p.status === "active",
  isFeatured: p.isFeatured,
  isTrending: p.isTrending,
});

const toPayload = (f: Form, current?: AdminProduct): ProductInput => ({
  name: f.name.trim(),
  brand: f.brand.trim(),
  sku: f.sku.trim(),
  price: Math.round(Number(f.price) * 100),
  compareAtPrice: f.compareAtPrice ? Math.round(Number(f.compareAtPrice) * 100) : null,
  stock: Math.max(0, Math.floor(Number(f.stock) || 0)),
  lowStockThreshold: Math.max(0, Math.floor(Number(f.lowStockThreshold) || 0)),
  scale: f.scale.trim(),
  series: f.series.trim(),
  material: f.material.trim(),
  description: f.description.trim(),
  collectionIds: f.collectionIds,
  // Archived products stay archived unless made visible again.
  status: f.visible ? "active" : current?.status === "archived" ? "archived" : "draft",
  isFeatured: f.isFeatured,
  isTrending: f.isTrending,
});

const REASON: Record<string, string> = {
  order: "Sold",
  cancel: "Order cancelled",
  restock: "Restocked",
  manual: "Adjusted",
  return: "Returned",
};

function ImageManager({
  product,
  pending,
  setPending,
}: {
  product: AdminProduct | null;
  pending: File[];
  setPending: (f: File[]) => void;
}) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const refresh = (p: AdminProduct) => {
    qc.setQueryData(["admin", "product", p.id], p);
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };
  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      let last: AdminProduct | null = null;
      for (const f of files) last = await adminApi.uploadImage(product!.id, f);
      return last!;
    },
    onSuccess: (p) => {
      refresh(p);
      toast.success("Photos uploaded");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const cover = useMutation({
    mutationFn: (imageId: string) => adminApi.setCover(product!.id, imageId),
    onSuccess: refresh,
  });
  const del = useMutation({
    mutationFn: (imageId: string) => adminApi.deleteImage(product!.id, imageId),
    onSuccess: refresh,
  });

  const onFiles = (list: FileList | null) => {
    const files = [...(list ?? [])].filter((f) => {
      const ok =
        ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024;
      if (!ok) toast.error(`${f.name}: use JPEG, PNG or WebP under 5 MB`);
      return ok;
    });
    if (!files.length) return;
    if (product) upload.mutate(files);
    else setPending([...pending, ...files]);
  };

  const images = product?.images ?? [];
  return (
    <div>
      <span className={labelClass}>Photos</span>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((im, i) => (
          <div
            key={im.id}
            className={cn(
              "group relative aspect-square animate-pop overflow-hidden rounded-xl bg-surface motion-reduce:animate-none",
              i === 0 && "ring-2 ring-brand",
            )}
          >
            <Image src={im.url} alt="" fill sizes="160px" className="object-cover" />
            {i === 0 && (
              <span className="absolute top-1 left-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                Cover
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => cover.mutate(im.id)}
                  className="grid size-8 place-items-center rounded-full bg-white text-night"
                  title="Make cover"
                  aria-label="Make cover photo"
                >
                  <Star className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => del.mutate(im.id)}
                className="grid size-8 place-items-center rounded-full bg-white text-sale"
                title="Delete"
                aria-label="Delete photo"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {pending.map((f, i) => (
          <div key={f.name + i} className="relative aspect-square overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview blob */}
            <img
              src={URL.createObjectURL(f)}
              alt=""
              className="size-full object-cover opacity-80"
            />
            {i === 0 && images.length === 0 && (
              <span className="absolute top-1 left-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => setPending(pending.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-white text-sale"
              aria-label="Remove photo"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={upload.isPending}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-input-border text-xs text-muted transition hover:border-ink hover:text-ink"
        >
          {upload.isPending ? (
            <Spinner />
          ) : (
            <>
              <Upload className="size-[18px]" /> Add
            </>
          )}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="mt-1.5 text-xs text-muted">
        JPEG, PNG or WebP up to 5 MB. Drag &amp; drop works. The first photo is the cover.
      </p>
    </div>
  );
}

function StockHistory({ productId }: { productId: string }) {
  const { data } = useQuery({
    queryKey: ["admin", "movements", productId],
    queryFn: () => adminApi.movements(productId),
  });
  if (!data?.length) return null;
  return (
    <div>
      <span className={labelClass}>Stock history</span>
      <ul className="divide-y divide-border rounded-2xl border border-border text-sm">
        {data.slice(0, 8).map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={cn(
                "w-10 shrink-0 font-semibold tabular-nums",
                m.change > 0 ? "text-in-stock" : "text-sale",
              )}
            >
              {m.change > 0 ? `+${m.change}` : m.change}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-ink">
                {REASON[m.reason] ?? m.reason}
                {m.orderNumber && ` · ${m.orderNumber}`}
              </span>
              {m.note && <span className="block truncate text-xs text-muted">{m.note}</span>}
            </span>
            <span className="shrink-0 text-xs text-muted">{dateTime(m.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Editor({
  productId,
  onClose,
  collections,
}: {
  productId: string | null;
  onClose: () => void;
  collections: AdminCollection[];
}) {
  const qc = useQueryClient();
  const open = productId !== null;
  const isNew = productId === "new";
  const { data: product } = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => adminApi.product(productId!),
    enabled: open && !isNew,
  });
  const [f, setF] = useState<Form>(EMPTY);
  const [pending, setPending] = useState<File[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Reset the form when a different product (or "new") opens.
  if (open && loadedFor !== productId && (isNew || product)) {
    setLoadedFor(productId);
    setPending([]);
    setF(isNew ? EMPTY : toForm(product!));
  }
  if (!open && loadedFor !== null) setLoadedFor(null);

  const save = useMutation({
    mutationFn: async () => {
      const body = toPayload(f, product);
      const saved = isNew
        ? await adminApi.createProduct(body)
        : await adminApi.updateProduct(productId!, body);
      for (const [i, file] of pending.entries())
        await adminApi.uploadImage(saved.id, file, i === 0 && saved.images.length === 0);
      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(isNew ? "Product added" : "Product saved");
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!f.name.trim() || !f.sku.trim() || !(Number(f.price) >= 1)) {
      toast.error("Name, SKU and a price of at least ₹1 are required");
      return;
    }
    if (f.compareAtPrice && Number(f.compareAtPrice) <= Number(f.price)) {
      toast.error("MRP should be higher than the selling price");
      return;
    }
    save.mutate();
  };

  const held = product?.reservedQty ?? 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isNew ? "Add product" : "Edit product"}
      footer={
        <div className="flex gap-2">
          <button className={btn.outline} onClick={onClose}>
            Cancel
          </button>
          <button
            className={cn(btn.primary, "flex-1")}
            onClick={() => submit()}
            disabled={save.isPending}
          >
            {save.isPending ? (
              <>
                <Spinner /> Saving…
              </>
            ) : isNew ? (
              "Add product"
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      }
    >
      {!isNew && !product ? (
        <div className="space-y-3 p-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-6 p-6">
          <ImageManager
            product={isNew ? null : product!}
            pending={pending}
            setPending={setPending}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="p-name">
                Product name *
              </label>
              <input
                id="p-name"
                className={inputClass}
                placeholder="e.g. '67 Ford Mustang Fastback – Teal"
                value={f.name}
                onChange={set("name")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-brand">
                Brand
              </label>
              <input
                id="p-brand"
                className={inputClass}
                placeholder="Hot Wheels"
                value={f.brand}
                onChange={set("brand")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-sku">
                SKU *
              </label>
              <input
                id="p-sku"
                className={inputClass}
                placeholder="CC-0042"
                value={f.sku}
                onChange={set("sku")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-price">
                Selling price (₹, incl. GST) *
              </label>
              <input
                id="p-price"
                className={inputClass}
                type="number"
                min="1"
                step="1"
                value={f.price}
                onChange={set("price")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-mrp">
                MRP (₹) <span className="font-normal text-muted">— shows a discount</span>
              </label>
              <input
                id="p-mrp"
                className={inputClass}
                type="number"
                min="1"
                step="1"
                value={f.compareAtPrice}
                onChange={set("compareAtPrice")}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="p-stock">
                  Stock on hand
                </label>
                <input
                  id="p-stock"
                  className={inputClass}
                  type="number"
                  min="0"
                  value={f.stock}
                  onChange={set("stock")}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-low">
                  Low-stock alert at
                </label>
                <input
                  id="p-low"
                  className={inputClass}
                  type="number"
                  min="0"
                  value={f.lowStockThreshold}
                  onChange={set("lowStockThreshold")}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Stock goes down automatically when an order is paid, and back up if a paid order is
              cancelled.
              {held > 0 && (
                <b className="text-ink">
                  {" "}
                  {held} unit{held > 1 && "s"} held by orders awaiting payment — customers can buy{" "}
                  {Math.max(0, Number(f.stock) - held)}.
                </b>
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="p-scale">
                Scale
              </label>
              <input
                id="p-scale"
                className={inputClass}
                placeholder="1:64"
                value={f.scale}
                onChange={set("scale")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-series">
                Series
              </label>
              <input
                id="p-series"
                className={inputClass}
                placeholder="Mainline"
                value={f.series}
                onChange={set("series")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-material">
                Material
              </label>
              <input
                id="p-material"
                className={inputClass}
                value={f.material}
                onChange={set("material")}
              />
            </div>
          </div>

          <div>
            <span className={labelClass}>Collections</span>
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => {
                const on = f.collectionIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setF({
                        ...f,
                        collectionIds: on
                          ? f.collectionIds.filter((x) => x !== c.id)
                          : [...f.collectionIds, c.id],
                      })
                    }
                    className={cn(
                      "h-9 rounded-full border px-4 text-sm font-medium transition",
                      on
                        ? "border-ink bg-ink text-background"
                        : "border-input-border text-ink hover:border-ink",
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="p-desc">
              Description
            </label>
            <textarea
              id="p-desc"
              className={cn(inputClass, "h-32 py-3")}
              value={f.description}
              onChange={set("description")}
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-border p-4">
            <Toggle
              label="Visible in store"
              checked={f.visible}
              onChange={(v) => setF({ ...f, visible: v })}
            />
            <Toggle
              label="Featured on home page (Shop Cars row)"
              checked={f.isFeatured}
              onChange={(v) => setF({ ...f, isFeatured: v })}
            />
            <Toggle
              label="Show in Trending (home page & /shop?trending=1)"
              checked={f.isTrending}
              onChange={(v) => setF({ ...f, isTrending: v })}
            />
          </div>

          {!isNew && product && <StockHistory productId={product.id} />}
        </form>
      )}
    </Drawer>
  );
}

const STOCK_FILTERS = [
  ["", "All stock"],
  ["low", "Low stock"],
  ["out", "Sold out"],
] as const;

function ProductsView() {
  const qc = useQueryClient();
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [collection, setCollection] = useState("");
  const [stock, setStock] = useState(params.get("stock") ?? "");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data: collections = [] } = useQuery({
    queryKey: ["admin", "collections"],
    queryFn: adminApi.collections,
  });
  const { data, isPending, isFetching } = useQuery({
    queryKey: ["admin", "products", q, collection, stock, page],
    queryFn: () =>
      adminApi.products({
        q: q || undefined,
        collection: collection || undefined,
        stock: stock || undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  const del = useMutation({
    mutationFn: adminApi.deleteProduct,
    onSuccess: (r) => {
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const quick = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ProductInput> }) =>
      adminApi.updateProduct(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const confirmDelete = (p: AdminProduct) =>
    window.confirm(`Delete "${p.name}"? Products that have orders are archived instead.`) &&
    del.mutate(p.id);

  const Thumb = ({ p, size }: { p: AdminProduct; size: string }) => (
    <span className={cn("relative shrink-0 overflow-hidden rounded-xl bg-surface", size)}>
      {p.images[0] ? (
        <Image src={p.images[0].url} alt="" fill sizes="64px" className="object-cover" />
      ) : (
        <ImageOff className="absolute inset-0 m-auto size-5 text-muted" />
      )}
    </span>
  );

  return (
    <div>
      <PageHead title="Products" subtitle={data ? `${data.total} products` : " "}>
        <button className={btn.brand} onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add product
        </button>
      </PageHead>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            className={cn(inputClass, "pl-10")}
            placeholder="Search name, brand, series or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={cn(inputClass, "w-auto")}
          value={collection}
          onChange={(e) => {
            setCollection(e.target.value);
            setPage(1);
          }}
          aria-label="Collection"
        >
          <option value="">All collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={cn(inputClass, "w-auto")}
          value={stock}
          onChange={(e) => {
            setStock(e.target.value);
            setPage(1);
          }}
          aria-label="Stock"
        >
          {STOCK_FILTERS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className={cn("transition-opacity", isFetching && !isPending && "opacity-60")}>
        {/* Mobile: cards */}
        <div className="space-y-2 md:hidden">
          {isPending
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)
            : data!.items.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3"
                >
                  <button
                    onClick={() => setEditing(p.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Thumb p={p} size="size-14" />
                    <span className="min-w-0">
                      <span className="line-clamp-1 text-sm font-medium text-ink">{p.name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <b className="text-ink">{formatPrice(p.price)}</b>
                        <StockBadge available={p.available} threshold={p.lowStockThreshold} />
                      </span>
                      {p.status !== "active" && (
                        <span className="text-xs text-muted">Hidden from store</span>
                      )}
                    </span>
                  </button>
                  <button
                    className={cn(btn.icon, "hover:text-sale")}
                    aria-label="Delete"
                    onClick={() => confirmDelete(p)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
        </div>

        {/* Tablet & desktop: table */}
        <Card className="hidden overflow-hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border bg-input/60 text-left text-xs tracking-wider text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Visible</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-4 py-3">
                        <Skeleton className="h-10" />
                      </td>
                    </tr>
                  ))
                ) : data!.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted">
                      No products found
                    </td>
                  </tr>
                ) : (
                  data!.items.map((p) => (
                    <tr key={p.id} className="transition hover:bg-input/50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditing(p.id)}
                          className="flex items-center gap-3 text-left"
                        >
                          <Thumb p={p} size="size-11" />
                          <span className="min-w-0">
                            <span className="line-clamp-1 font-medium text-ink hover:underline">
                              {p.name}
                            </span>
                            <span className="text-xs text-muted">
                              {p.sku} ·{" "}
                              {p.collections.map((c) => c.name).join(", ") || "No collection"}
                              {p.isFeatured && " · ★ Featured"}
                              {p.isTrending && " · 🔥 Trending"}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <b className="text-ink">{formatPrice(p.price)}</b>
                        {p.compareAtPrice && (
                          <span className="ml-1.5 text-xs text-muted line-through">
                            {formatPrice(p.compareAtPrice)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge available={p.available} threshold={p.lowStockThreshold} />
                        {p.reservedQty > 0 && (
                          <span className="mt-1 block text-xs text-muted">
                            {p.reservedQty} held for payment
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === "archived" ? (
                          <StatusBadge status="archived" />
                        ) : (
                          <Toggle
                            label=""
                            checked={p.status === "active"}
                            disabled={quick.isPending}
                            onChange={(v) =>
                              quick.mutate({ id: p.id, body: { status: v ? "active" : "draft" } })
                            }
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          className={btn.icon}
                          onClick={() => setEditing(p.id)}
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className={cn(btn.icon, "hover:text-sale")}
                          aria-label="Delete"
                          onClick={() => confirmDelete(p)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {data && data.pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {page} of {data.pages}
          </span>
          <div className="flex gap-1">
            <button
              className={btn.icon}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              className={btn.icon}
              disabled={page === data.pages}
              onClick={() => setPage(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <Editor productId={editing} onClose={() => setEditing(null)} collections={collections} />
    </div>
  );
}

export function ProductsAdminView() {
  return (
    <Suspense>
      <ProductsView />
    </Suspense>
  );
}
