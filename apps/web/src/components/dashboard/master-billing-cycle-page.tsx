import { Button } from "@isp-app/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@isp-app/ui/components/card";
import { Input } from "@isp-app/ui/components/input";
import { Label } from "@isp-app/ui/components/label";
import { Skeleton } from "@isp-app/ui/components/skeleton";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import Modal from "./modal";
import { queryClient, trpc } from "@/utils/trpc";

export default function MasterBillingCyclePage() {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [graceDays, setGraceDays] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDayOfMonth, setEditDayOfMonth] = useState("");
  const [editGraceDays, setEditGraceDays] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const listInput = useMemo(() => {
    const trimmed = query.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 20,
      offset: 0,
    };
  }, [query]);

  const listQuery = useQuery(trpc.billingCycle.list.queryOptions(listInput));
  const rows = listQuery.data?.items ?? [];
  const detailQuery = useQuery(trpc.billingCycle.byId.queryOptions(selectedId ? { id: selectedId } : skipToken));

  useEffect(() => {
    const row = detailQuery.data;
    if (!row || !editOpen) return;
    setEditCode(row.code);
    setEditName(row.name);
    setEditDayOfMonth(String(row.dayOfMonth));
    setEditGraceDays(String(row.graceDays));
    setEditIsActive(row.isActive);
  }, [detailQuery.data, editOpen]);

  const createMutation = useMutation(
    trpc.billingCycle.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.billingCycle.list.queryKey(listInput) });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.billingCycle.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.billingCycle.list.queryKey(listInput) });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.billingCycle.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.billingCycle.list.queryKey(listInput) });
      },
    }),
  );

  return (
    <Card className="bg-background">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Billing Cycle</span>
          <span className="text-xs font-medium text-muted-foreground">
            {listQuery.isLoading ? <Skeleton className="h-3 w-20" /> : `${listQuery.data?.total ?? 0} total`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Cari code / name" />
          </div>
          {listQuery.isError ? (
            <p className="text-xs text-destructive">{listQuery.error.message}</p>
          ) : (
            <Button size="sm" className="rounded-lg" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Billing Cycle
            </Button>
          )}
        </div>

        <div className="mt-3 min-h-0 overflow-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 font-medium">Code</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Day of Month</th>
                <th className="py-2 font-medium">Grace Days</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading
                ? new Array(8).fill(null).map((_, index) => (
                    <tr key={`billing-cycle-skeleton-${index}`} className="border-b last:border-0">
                      <td className="py-3"><Skeleton className="h-3 w-16" /></td>
                      <td className="py-3"><Skeleton className="h-3 w-32" /></td>
                      <td className="py-3"><Skeleton className="h-3 w-12" /></td>
                      <td className="py-3"><Skeleton className="h-3 w-12" /></td>
                      <td className="py-3"><Skeleton className="h-3 w-14" /></td>
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/20"
                      onClick={() => {
                        setSelectedId(row.id);
                        setEditOpen(true);
                      }}
                    >
                      <td className="py-3 font-medium">{row.code}</td>
                      <td className="py-3">{row.name}</td>
                      <td className="py-3">{row.dayOfMonth}</td>
                      <td className="py-3">{row.graceDays}</td>
                      <td className="py-3">{row.isActive ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
              {!listQuery.isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada billing cycle. Klik Add Billing Cycle untuk membuat data pertama.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Modal open={createOpen} title="Create Billing Cycle" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const parsedDay = Number(dayOfMonth);
            const parsedGrace = Number(graceDays || "0");
            if (!code.trim() || !name.trim() || Number.isNaN(parsedDay) || Number.isNaN(parsedGrace)) {
              toast.error("Code, Name, Day of Month, Grace Days wajib valid");
              return;
            }
            try {
              await createMutation.mutateAsync({
                code: code.trim(),
                name: name.trim(),
                dayOfMonth: parsedDay,
                graceDays: parsedGrace,
                isActive,
              });
              setCreateOpen(false);
              setCode("");
              setName("");
              setDayOfMonth("");
              setGraceDays("");
              setIsActive(true);
              toast.success("Billing cycle berhasil dibuat");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal membuat billing cycle");
            }
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="create-billing-cycle-code">Code</Label>
            <Input id="create-billing-cycle-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="MONTHLY_1" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-billing-cycle-name">Name</Label>
            <Input id="create-billing-cycle-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Monthly Tanggal 1" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-billing-cycle-day">Day of Month</Label>
            <Input id="create-billing-cycle-day" type="number" min={1} max={31} value={dayOfMonth} onChange={(event) => setDayOfMonth(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-billing-cycle-grace">Grace Days</Label>
            <Input id="create-billing-cycle-grace" type="number" min={0} max={90} value={graceDays} onChange={(event) => setGraceDays(event.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="create-billing-cycle-status">Status</Label>
            <select
              id="create-billing-cycle-status"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={isActive ? "active" : "inactive"}
              onChange={(event) => setIsActive(event.target.value === "active")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" className="rounded-lg border-border bg-background" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg" disabled={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title="Edit Billing Cycle"
        onClose={() => {
          setEditOpen(false);
          setSelectedId(null);
        }}
      >
        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : detailQuery.isError || !detailQuery.data ? (
          <p className="text-sm text-muted-foreground">Billing cycle tidak ditemukan.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const parsedDay = Number(editDayOfMonth);
              const parsedGrace = Number(editGraceDays || "0");
              if (Number.isNaN(parsedDay) || Number.isNaN(parsedGrace)) {
                toast.error("Day of Month dan Grace Days harus angka");
                return;
              }
              try {
                await updateMutation.mutateAsync({
                  id: detailQuery.data.id,
                  code: editCode.trim(),
                  name: editName.trim(),
                  dayOfMonth: parsedDay,
                  graceDays: parsedGrace,
                  isActive: editIsActive,
                });
                toast.success("Billing cycle berhasil disimpan");
                setEditOpen(false);
                setSelectedId(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan billing cycle");
              }
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="edit-billing-cycle-code">Code</Label>
              <Input id="edit-billing-cycle-code" value={editCode} onChange={(event) => setEditCode(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-billing-cycle-name">Name</Label>
              <Input id="edit-billing-cycle-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-billing-cycle-day">Day of Month</Label>
              <Input id="edit-billing-cycle-day" type="number" min={1} max={31} value={editDayOfMonth} onChange={(event) => setEditDayOfMonth(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-billing-cycle-grace">Grace Days</Label>
              <Input id="edit-billing-cycle-grace" type="number" min={0} max={90} value={editGraceDays} onChange={(event) => setEditGraceDays(event.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-billing-cycle-status">Status</Label>
              <select
                id="edit-billing-cycle-status"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editIsActive ? "active" : "inactive"}
                onChange={(event) => setEditIsActive(event.target.value === "active")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 md:col-span-2">
              <Button type="button" variant="destructive" className="rounded-lg" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-border bg-background"
                  onClick={() => {
                    setEditOpen(false);
                    setSelectedId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg" disabled={updateMutation.isPending}>
                  Save
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={deleteOpen} title="Delete Billing Cycle" onClose={() => setDeleteOpen(false)}>
        {!detailQuery.data ? (
          <p className="text-sm text-muted-foreground">Billing cycle tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus billing cycle <span className="font-medium">{detailQuery.data.code}</span> -{" "}
              <span className="font-medium">{detailQuery.data.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" className="rounded-lg border-border bg-background" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-lg"
                disabled={deleteMutation.isPending}
                onClick={async () => {
                  if (!detailQuery.data) return;
                  try {
                    await deleteMutation.mutateAsync({ id: detailQuery.data.id });
                    toast.success("Billing cycle dihapus");
                    setDeleteOpen(false);
                    setEditOpen(false);
                    setSelectedId(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal menghapus billing cycle");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
