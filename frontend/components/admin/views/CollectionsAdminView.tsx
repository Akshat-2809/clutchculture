"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Card,
  Modal,
  PageHead,
  Skeleton,
  Spinner,
  Toggle,
  btn,
  errorMessage,
  inputClass,
  labelClass,
  toast,
} from "@/components/admin/ui";
import { type AdminCollection, adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type Form = { name: string; description: string; sortOrder: string; isActive: boolean };
const EMPTY: Form = { name: "", description: "", sortOrder: "0", isActive: true };

export function CollectionsAdminView() {
  const qc = useQueryClient();
  const { data: list, isPending } = useQuery({
    queryKey: ["admin", "collections"],
    queryFn: adminApi.collections,
  });
  const [editing, setEditing] = useState<AdminCollection | "new" | null>(null);
  const [f, setF] = useState<Form>(EMPTY);

  const openEditor = (c: AdminCollection | "new") => {
    setEditing(c);
    setF(
      c === "new"
        ? { ...EMPTY, sortOrder: String(list?.length ?? 0) }
        : {
            name: c.name,
            description: c.description ?? "",
            sortOrder: String(c.sortOrder),
            isActive: c.isActive,
          },
    );
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "collections"] });
    qc.invalidateQueries({ queryKey: ["collections"] });
  };
  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: f.name.trim(),
        description: f.description.trim(),
        imageUrl: "",
        sortOrder: Number(f.sortOrder) || 0,
        isActive: f.isActive,
      };
      return editing === "new"
        ? adminApi.createCollection(body)
        : adminApi.updateCollection((editing as AdminCollection).id, body);
    },
    onSuccess: () => {
      refresh();
      setEditing(null);
      toast.success("Collection saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const del = useMutation({
    mutationFn: adminApi.deleteCollection,
    onSuccess: () => {
      refresh();
      toast.success("Collection deleted");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <PageHead title="Collections" subtitle="The categories in your store's menu, in this order">
        <button className={btn.brand} onClick={() => openEditor("new")}>
          <Plus className="size-4" /> Add collection
        </button>
      </PageHead>

      {isPending ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list!.map((c) => (
            <Card
              key={c.id}
              className="group animate-fade-up overflow-hidden transition hover:-translate-y-1 hover:shadow-lg motion-reduce:animate-none"
            >
              <div className="relative flex h-28 items-center justify-center overflow-hidden bg-night">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] bg-[size:28px_28px]"
                />
                <p className="relative font-headline text-2xl font-extrabold text-white uppercase italic">
                  {c.name}
                </p>
                {!c.isActive && (
                  <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-night">
                    Hidden
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.productCount} products · /collections/{c.slug}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Link
                    href={`/collections/${c.slug}`}
                    target="_blank"
                    className={btn.icon}
                    aria-label="View in store"
                  >
                    <ExternalLink className="size-4" />
                  </Link>
                  <button className={btn.icon} onClick={() => openEditor(c)} aria-label="Edit">
                    <Pencil className="size-4" />
                  </button>
                  <button
                    className={cn(btn.icon, "hover:text-sale")}
                    aria-label="Delete"
                    onClick={() =>
                      window.confirm(
                        `Delete "${c.name}"? Its ${c.productCount} products stay in the store, just without this collection.`,
                      ) && del.mutate(c.id)
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {list!.length === 0 && (
            <div className="col-span-full flex flex-col items-center py-16 text-center text-muted">
              <FolderTree className="size-10" strokeWidth={1.5} />
              <p className="mt-3">No collections yet</p>
            </div>
          )}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New collection" : "Edit collection"}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (f.name.trim().length < 2) return toast.error("Give the collection a name");
            save.mutate();
          }}
        >
          <div>
            <label className={labelClass} htmlFor="c-name">
              Name
            </label>
            <input
              id="c-name"
              className={inputClass}
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
            {editing === "new" && (
              <p className="mt-1 text-xs text-muted">
                The web address is made from the name and can&apos;t change later.
              </p>
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="c-desc">
              Description
            </label>
            <textarea
              id="c-desc"
              className={cn(inputClass, "h-24 py-3")}
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="c-sort">
              Menu position
            </label>
            <input
              id="c-sort"
              className={inputClass}
              type="number"
              value={f.sortOrder}
              onChange={(e) => setF({ ...f, sortOrder: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted">Lower numbers appear first in the menu.</p>
          </div>
          <Toggle
            label="Show in store"
            checked={f.isActive}
            onChange={(v) => setF({ ...f, isActive: v })}
          />
          <button className={cn(btn.primary, "w-full")} disabled={save.isPending}>
            {save.isPending ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              "Save collection"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
