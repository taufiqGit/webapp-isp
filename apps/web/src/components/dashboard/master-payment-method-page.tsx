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

type PaymentMethodType = "cash" | "bank_transfer" | "virtual_account" | "qris" | "gateway" | "other";

export default function MasterPaymentMethodPage() {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<PaymentMethodType>("bank_transfer");
  const [isActive, setIsActive] = useState(true);

  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<PaymentMethodType>("bank_transfer");
  const [editIsActive, setEditIsActive] = useState(true);

  const listInput = useMemo(() => {
    const trimmed = query.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 20,
      offset: 0,
    };
  }, [query]);

  const listQuery = useQuery(trpc.paymentMethod.list.queryOptions(listInput));
  const rows = listQuery.data?.items ?? [];
  const detailQuery = useQuery(trpc.paymentMethod.byId.queryOptions(selectedId ? { id: selectedId } : skipToken));

  useEffect(() => {
    const row = detailQuery.data;
    if (!row || !editOpen) return;
    setEditCode(row.code);
    setEditName(row.name);
    setEditType(row.type);
    setEditIsActive(row.isActive);
  }, [detailQuery.data, editOpen]);

  const createMutation = useMutation(
    trpc.paymentMethod.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.paymentMethod.list.queryKey(listInput) });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.paymentMethod.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.paymentMethod.list.queryKey(listInput) });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.paymentMethod.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.paymentMethod.list.queryKey(listInput) });
      },
    }),
  );

  return (
    <Card className="bg-background">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Payment Method</span>
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
              Add Payment Method
            </Button>
          )}
        </div>

        <div className="mt-3 min-h-0 overflow-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 font-medium">Code</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading
                ? new Array(8).fill(null).map((_, index) => (
                    <tr key={`payment-method-skeleton-${index}`} className="border-b last:border-0">
                      <td className="py-3"><Skeleton className="h-3 w-16" /></td>
                      <td className="py-3"><Skeleton className="h-3 w-32" /></td>
                      <td className="py-3"><Skeleton className="h-3 w-20" /></td>
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
                      <td className="py-3">{row.type}</td>
                      <td className="py-3">{row.isActive ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
              {!listQuery.isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada payment method. Klik Add Payment Method untuk membuat data pertama.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Modal open={createOpen} title="Create Payment Method" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!code.trim() || !name.trim()) {
              toast.error("Code dan Name wajib diisi");
              return;
            }
            try {
              await createMutation.mutateAsync({
                code: code.trim(),
                name: name.trim(),
                type,
                isActive,
              });
              setCreateOpen(false);
              setCode("");
              setName("");
              setType("bank_transfer");
              setIsActive(true);
              toast.success("Payment method berhasil dibuat");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal membuat payment method");
            }
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="create-payment-method-code">Code</Label>
            <Input id="create-payment-method-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="VA_BCA" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-payment-method-name">Name</Label>
            <Input id="create-payment-method-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Virtual Account BCA" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-payment-method-type">Type</Label>
            <select
              id="create-payment-method-type"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={type}
              onChange={(event) => setType(event.target.value as PaymentMethodType)}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="virtual_account">Virtual Account</option>
              <option value="qris">QRIS</option>
              <option value="gateway">Gateway</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-payment-method-status">Status</Label>
            <select
              id="create-payment-method-status"
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
        title="Edit Payment Method"
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
          <p className="text-sm text-muted-foreground">Payment method tidak ditemukan.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await updateMutation.mutateAsync({
                  id: detailQuery.data.id,
                  code: editCode.trim(),
                  name: editName.trim(),
                  type: editType,
                  isActive: editIsActive,
                });
                toast.success("Payment method berhasil disimpan");
                setEditOpen(false);
                setSelectedId(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan payment method");
              }
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="edit-payment-method-code">Code</Label>
              <Input id="edit-payment-method-code" value={editCode} onChange={(event) => setEditCode(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-payment-method-name">Name</Label>
              <Input id="edit-payment-method-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-payment-method-type">Type</Label>
              <select
                id="edit-payment-method-type"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editType}
                onChange={(event) => setEditType(event.target.value as PaymentMethodType)}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="virtual_account">Virtual Account</option>
                <option value="qris">QRIS</option>
                <option value="gateway">Gateway</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-payment-method-status">Status</Label>
              <select
                id="edit-payment-method-status"
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

      <Modal open={deleteOpen} title="Delete Payment Method" onClose={() => setDeleteOpen(false)}>
        {!detailQuery.data ? (
          <p className="text-sm text-muted-foreground">Payment method tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus payment method <span className="font-medium">{detailQuery.data.code}</span> -{" "}
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
                    toast.success("Payment method dihapus");
                    setDeleteOpen(false);
                    setEditOpen(false);
                    setSelectedId(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal menghapus payment method");
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
