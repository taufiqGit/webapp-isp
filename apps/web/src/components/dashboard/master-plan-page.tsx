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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value);
}

export default function MasterPlanPage() {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [speedMbps, setSpeedMbps] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
  const [taxId, setTaxId] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editSpeedMbps, setEditSpeedMbps] = useState("");
  const [editPriceMonthly, setEditPriceMonthly] = useState("");
  const [editTaxId, setEditTaxId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const listInput = useMemo(() => {
    const trimmed = query.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 20,
      offset: 0,
    };
  }, [query]);

  const planListQuery = useQuery(trpc.plan.list.queryOptions(listInput));
  const rows = planListQuery.data?.items ?? [];

  const planDetailQuery = useQuery(trpc.plan.byId.queryOptions(selectedPlanId ? { id: selectedPlanId } : skipToken));
  const taxListQuery = useQuery(
    trpc.tax.list.queryOptions({
      limit: 100,
      offset: 0,
    }),
  );

  useEffect(() => {
    const row = planDetailQuery.data;
    if (!row || !editOpen) return;

    setEditCode(row.code);
    setEditName(row.name);
    setEditSpeedMbps(String(row.speedMbps));
    setEditPriceMonthly(String(row.priceMonthly));
    setEditTaxId(row.taxId ?? "");
    setEditDescription(row.description ?? "");
    setEditIsActive(Boolean(row.isActive));
  }, [planDetailQuery.data, editOpen]);

  const createMutation = useMutation(
    trpc.plan.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.plan.list.queryKey(listInput),
        });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.plan.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.plan.list.queryKey(listInput),
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.plan.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.plan.list.queryKey(listInput),
        });
      },
    }),
  );

  return (
    <Card className="bg-background">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Plan List</span>
          <span className="text-xs font-medium text-muted-foreground">
            {planListQuery.isLoading ? <Skeleton className="h-3 w-20" /> : `${planListQuery.data?.total ?? 0} total`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Cari kode / nama / deskripsi"
            />
          </div>
          {planListQuery.isError ? (
            <p className="text-xs text-destructive">{planListQuery.error.message}</p>
          ) : (
            <Button size="sm" className="rounded-lg" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Plan
            </Button>
          )}
        </div>

        <div className="mt-3 min-h-0 overflow-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 font-medium">Code</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium text-right">Speed</th>
                <th className="py-2 font-medium text-right">Price / Month</th>
                <th className="py-2 font-medium">Tax</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {planListQuery.isLoading
                ? new Array(8).fill(null).map((_, index) => (
                    <tr key={`plan-skeleton-${index}`} className="border-b last:border-0">
                      <td className="py-3">
                        <Skeleton className="h-3 w-16" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-32" />
                      </td>
                      <td className="py-3 text-right">
                        <Skeleton className="ml-auto h-3 w-16" />
                      </td>
                      <td className="py-3 text-right">
                        <Skeleton className="ml-auto h-3 w-20" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-16" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-14" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-36" />
                      </td>
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/20"
                      onClick={() => {
                        setSelectedPlanId(row.id);
                        setEditOpen(true);
                      }}
                    >
                      <td className="py-3 font-medium">{row.code}</td>
                      <td className="py-3">{row.name}</td>
                      <td className="py-3 text-right">{row.speedMbps} Mbps</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(row.priceMonthly)} </td>
                      <td className="py-3">{row.taxName ?? "-"}</td>
                      <td className="py-3">{row.isActive ? "Active" : "Inactive"}</td>
                      <td className="py-3 text-muted-foreground">{row.description ?? "-"}</td>
                    </tr>
                  ))}
              {!planListQuery.isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada data plan. Klik Add Plan untuk membuat data pertama.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Modal open={createOpen} title="Create Plan" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const parsedSpeed = Number(speedMbps);
            const parsedPrice = Number(priceMonthly);

            if (!code.trim() || !name.trim() || Number.isNaN(parsedSpeed) || Number.isNaN(parsedPrice)) {
              toast.error("Code, Name, Speed, dan Price wajib valid");
              return;
            }

            try {
              await createMutation.mutateAsync({
                code: code.trim(),
                name: name.trim(),
                speedMbps: parsedSpeed,
                priceMonthly: parsedPrice,
                taxId: taxId || undefined,
                isActive,
                description: description.trim() ? description.trim() : undefined,
              });
              setCreateOpen(false);
              setCode("");
              setName("");
              setSpeedMbps("");
              setPriceMonthly("");
              setTaxId("");
              setDescription("");
              setIsActive(true);
              toast.success("Plan berhasil dibuat");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal membuat plan");
            }
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="create-plan-code">Code</Label>
            <Input id="create-plan-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="HOME-20" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-plan-name">Name</Label>
            <Input id="create-plan-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Home 20 Mbps" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-plan-speed">Speed (Mbps)</Label>
            <Input id="create-plan-speed" type="number" min={1} value={speedMbps} onChange={(event) => setSpeedMbps(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-plan-price">Price Monthly</Label>
            <Input id="create-plan-price" type="number" min={0} value={priceMonthly} onChange={(event) => setPriceMonthly(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-plan-tax">Tax</Label>
            <select
              id="create-plan-tax"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={taxId}
              onChange={(event) => setTaxId(event.target.value)}
            >
              <option value="">No Tax</option>
              {(taxListQuery.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-plan-status">Status</Label>
            <select
              id="create-plan-status"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={isActive ? "active" : "inactive"}
              onChange={(event) => setIsActive(event.target.value === "active")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="create-plan-description">Description</Label>
            <Input
              id="create-plan-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="opsional"
            />
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
        title="Edit Plan"
        onClose={() => {
          setEditOpen(false);
          setSelectedPlanId(null);
        }}
      >
        {planDetailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : planDetailQuery.isError || !planDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Plan tidak ditemukan.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const parsedSpeed = Number(editSpeedMbps);
              const parsedPrice = Number(editPriceMonthly);
              if (Number.isNaN(parsedSpeed) || Number.isNaN(parsedPrice)) {
                toast.error("Speed dan Price harus berupa angka");
                return;
              }

              try {
                await updateMutation.mutateAsync({
                  id: planDetailQuery.data.id,
                  code: editCode.trim(),
                  name: editName.trim(),
                  speedMbps: parsedSpeed,
                  priceMonthly: parsedPrice,
                  taxId: editTaxId ? editTaxId : null,
                  isActive: editIsActive,
                  description: editDescription.trim() ? editDescription.trim() : null,
                });
                toast.success("Plan berhasil disimpan");
                setEditOpen(false);
                setSelectedPlanId(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan plan");
              }
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="edit-plan-code">Code</Label>
              <Input id="edit-plan-code" value={editCode} onChange={(event) => setEditCode(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-plan-name">Name</Label>
              <Input id="edit-plan-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-plan-speed">Speed (Mbps)</Label>
              <Input
                id="edit-plan-speed"
                type="number"
                min={1}
                value={editSpeedMbps}
                onChange={(event) => setEditSpeedMbps(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-plan-price">Price Monthly</Label>
              <Input
                id="edit-plan-price"
                type="number"
                min={0}
                value={editPriceMonthly}
                onChange={(event) => setEditPriceMonthly(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-plan-tax">Tax</Label>
              <select
                id="edit-plan-tax"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editTaxId}
                onChange={(event) => setEditTaxId(event.target.value)}
              >
                <option value="">No Tax</option>
                {(taxListQuery.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-plan-status">Status</Label>
              <select
                id="edit-plan-status"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editIsActive ? "active" : "inactive"}
                onChange={(event) => setEditIsActive(event.target.value === "active")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-plan-description">Description</Label>
              <Input id="edit-plan-description" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
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
                    setSelectedPlanId(null);
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

      <Modal open={deleteOpen} title="Delete Plan" onClose={() => setDeleteOpen(false)}>
        {!planDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Plan tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus plan <span className="font-medium">{planDetailQuery.data.code}</span> -{" "}
              <span className="font-medium">{planDetailQuery.data.name}</span>?
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
                  if (!planDetailQuery.data) return;
                  try {
                    await deleteMutation.mutateAsync({ id: planDetailQuery.data.id });
                    toast.success("Plan dihapus");
                    setDeleteOpen(false);
                    setEditOpen(false);
                    setSelectedPlanId(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal menghapus plan");
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
