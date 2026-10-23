"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  PageHead,
  Skeleton,
  date,
  errorMessage,
  inputClass,
  toast,
} from "@/components/admin/ui";
import { type Customer, adminApi } from "@/lib/admin-api";
import { useMe } from "@/lib/use-me";
import { cn, formatPrice } from "@/lib/utils";

const initial = (u: Customer) => (u.fullName || u.email || "?")[0]!.toUpperCase();

export function CustomersAdminView() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data: users, isPending } = useQuery({
    queryKey: ["admin", "customers", q],
    queryFn: () => adminApi.customers(q || undefined),
  });
  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Customer["role"] }) =>
      adminApi.setRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const RoleSelect = (u: Customer) => (
    <select
      disabled={u.id === me?.id}
      value={u.role}
      onChange={(e) => {
        const role = e.target.value as Customer["role"];
        if (role === "admin" && !window.confirm(`Give ${u.email} full admin access?`)) return;
        setRole.mutate({ id: u.id, role });
      }}
      className={cn(inputClass, "h-8 w-auto rounded-full px-3 text-xs")}
      aria-label="Role"
    >
      <option value="customer">Customer</option>
      <option value="admin">Admin</option>
    </select>
  );

  return (
    <div>
      <PageHead title="Customers" subtitle={users ? `${users.length} accounts` : " "} />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <input
          className={cn(inputClass, "pl-10")}
          placeholder="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2 md:hidden">
        {isPending
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)
          : users!.map((u) => (
              <div key={u.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                    {initial(u)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{u.fullName || "—"}</p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold text-ink">
                    {formatPrice(u.spend)}
                    <span className="block text-xs font-normal text-muted">{u.orders} orders</span>
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {RoleSelect(u)}
                  <span className="ml-auto text-xs text-muted">Joined {date(u.createdAt)}</span>
                </div>
              </div>
            ))}
      </div>

      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-input/60 text-left text-xs tracking-wider text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Paid orders</th>
                <th className="px-4 py-3">Spend</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isPending
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-4 py-3">
                        <Skeleton className="h-8" />
                      </td>
                    </tr>
                  ))
                : users!.map((u) => (
                    <tr key={u.id} className="hover:bg-input/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                            {initial(u)}
                          </span>
                          <span>
                            <span className="block font-medium text-ink">{u.fullName || "—"}</span>
                            <span className="text-xs text-muted">
                              {u.email}
                              {u.phone && ` · ${u.phone}`}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{date(u.createdAt)}</td>
                      <td className="px-4 py-3 text-ink">{u.orders}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{formatPrice(u.spend)}</td>
                      <td className="px-4 py-3">{RoleSelect(u)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
