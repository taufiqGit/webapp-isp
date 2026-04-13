import { Button } from "@isp-app/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@isp-app/ui/components/card";
import { Input } from "@isp-app/ui/components/input";
import { Label } from "@isp-app/ui/components/label";
import { Skeleton } from "@isp-app/ui/components/skeleton";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import Modal from "./modal";
import { queryClient, trpc } from "@/utils/trpc";

type CustomerType = "individual" | "business";

export default function CustomersCustomerPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<CustomerType>("individual");
  const [lastCustomer, setLastCustomer] = useState<{ id: string; customerNumber: string; name: string } | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editType, setEditType] = useState<CustomerType>("individual");

  const listInput = useMemo(() => {
    const trimmed = query.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 20,
      offset: 0,
    };
  }, [query]);

  const listQuery = useQuery(trpc.customer.list.queryOptions(listInput));
  const rows = listQuery.data?.items ?? [];

  const customerDetailQuery = useQuery(
    trpc.customer.byId.queryOptions(selectedCustomerId ? { id: selectedCustomerId } : skipToken),
  );

  useEffect(() => {
    const customer = customerDetailQuery.data;
    if (!customer || !editOpen) return;
    setEditName(customer.name);
    setEditType(customer.type);
    setEditEmail(customer.email ?? "");
    setEditPhone(customer.phone ?? "");
  }, [customerDetailQuery.data, editOpen]);

  const createMutation = useMutation(
    trpc.customer.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.customer.list.queryKey(listInput),
        });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.customer.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.customer.list.queryKey(listInput),
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.customer.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.customer.list.queryKey(listInput),
        });
      },
    }),
  );

  return (
    <div className="grid h-full min-h-0 gap-3 grid-rows-[auto_minmax(0,1fr)]">
      {lastCustomer ? (
        <Card className="bg-background">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm">Next Step</CardTitle>
            <p className="text-xs text-muted-foreground">
              Customer <span className="font-medium">{lastCustomer.customerNumber}</span> dibuat:{" "}
              <span className="font-medium">{lastCustomer.name}</span>
            </p>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  navigate({
                    to: "/customers/subscription",
                    search: { customerId: lastCustomer.id },
                  });
                }}
              >
                Buat subscription
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg border-border bg-background"
                onClick={() => {
                  setLastCustomer(null);
                }}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-background">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Customer List</span>
            <span className="text-xs font-medium text-muted-foreground">
              {listQuery.isLoading ? <Skeleton className="h-3 w-20" /> : `${listQuery.data?.total ?? 0} total`}
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
                placeholder="Cari nama / nomor / email / telp"
              />
            </div>
            {listQuery.isError ? (
              <p className="text-xs text-destructive">{listQuery.error.message}</p>
            ) : (
              <Button
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                Add Customer
              </Button>
            )}
          </div>

          <div className="mt-3 min-h-0 overflow-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 font-medium">Customer No</th>
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Phone</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading
                  ? new Array(8).fill(null).map((_, index) => (
                      <tr key={`customer-skeleton-${index}`} className="border-b last:border-0">
                        <td className="py-3 font-medium">
                          <Skeleton className="h-3 w-28" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="mb-1 h-3 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-16" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-20" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-40" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-28" />
                        </td>
                      </tr>
                    ))
                  : rows.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/20"
                        onClick={() => {
                          setSelectedCustomerId(row.id);
                          setEditOpen(true);
                        }}
                      >
                        <td className="py-3 font-medium">{row.customerNumber}</td>
                        <td className="py-3">
                          <p className="font-medium">{row.name}</p>
                          <p className="text-muted-foreground">{row.id}</p>
                        </td>
                        <td className="py-3">{row.type}</td>
                        <td className="py-3">{row.status}</td>
                        <td className="py-3">{row.email ?? "-"}</td>
                        <td className="py-3">{row.phone ?? "-"}</td>
                      </tr>
                    ))}
                {!listQuery.isLoading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Belum ada customer. Klik Add Customer untuk membuat customer pertama.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={createOpen}
        title="Create Customer"
        onClose={() => {
          setCreateOpen(false);
        }}
      >
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmedName = name.trim();
            if (!trimmedName.length) {
              toast.error("Nama customer wajib diisi");
              return;
            }
            try {
              const created = await createMutation.mutateAsync({
                name: trimmedName,
                email: email.trim().length ? email.trim() : undefined,
                phone: phone.trim().length ? phone.trim() : undefined,
                type,
              });

              setLastCustomer({
                id: created.id,
                customerNumber: created.customerNumber,
                name: created.name,
              });
              setCreateOpen(false);
              setName("");
              setEmail("");
              setPhone("");
              setType("individual");

              toast.success("Customer berhasil dibuat", {
                action: {
                  label: "Buat subscription",
                  onClick: () => {
                    navigate({
                      to: "/customers/subscription",
                      search: { customerId: created.id },
                    });
                  },
                },
              });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal membuat customer");
            }
          }}
        >
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="create-customer-name">Name</Label>
            <Input
              id="create-customer-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Budi Santoso / PT. Nusantara Net"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-customer-type">Type</Label>
            <select
              id="create-customer-type"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={type}
              onChange={(event) => setType(event.target.value as CustomerType)}
            >
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Input value="prospect" readOnly />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-customer-email">Email</Label>
            <Input
              id="create-customer-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="opsional"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-customer-phone">Phone</Label>
            <Input
              id="create-customer-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="opsional"
            />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-border bg-background"
              onClick={() => {
                setCreateOpen(false);
              }}
            >
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
        title="Edit Customer"
        onClose={() => {
          setEditOpen(false);
          setSelectedCustomerId(null);
        }}
      >
        {customerDetailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : customerDetailQuery.isError || !customerDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Customer tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await updateMutation.mutateAsync({
                    id: customerDetailQuery.data.id,
                    name: editName.trim(),
                    type: editType,
                    email: editEmail.trim().length ? editEmail.trim() : null,
                    phone: editPhone.trim().length ? editPhone.trim() : null,
                  });
                  toast.success("Customer berhasil disimpan");
                  setEditOpen(false);
                  setSelectedCustomerId(null);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Gagal menyimpan customer");
                }
              }}
            >
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="edit-customer-name">Name</Label>
                <Input
                  id="edit-customer-name"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-customer-type">Type</Label>
                <select
                  id="edit-customer-type"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={editType}
                  onChange={(event) => setEditType(event.target.value as CustomerType)}
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Input value={customerDetailQuery.data.status} readOnly />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-customer-email">Email</Label>
                <Input
                  id="edit-customer-email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  placeholder="opsional"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-customer-phone">Phone</Label>
                <Input
                  id="edit-customer-phone"
                  value={editPhone}
                  onChange={(event) => setEditPhone(event.target.value)}
                  placeholder="opsional"
                />
              </div>
              <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-border bg-background"
                  onClick={() => {
                    setEditOpen(false);
                    setSelectedCustomerId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg" disabled={updateMutation.isPending}>
                  Save
                </Button>
              </div>
            </form>

            {customerDetailQuery.data.status === "terminated" ? (
              <div className="rounded-lg border border-destructive/40 p-3">
                <p className="text-xs font-semibold text-destructive">Danger Zone</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Menghapus customer akan menghapus semua subscription (cascade).
                </p>
                <div className="mt-3">
                  <Button
                    variant="destructive"
                    className="rounded-lg"
                    onClick={() => {
                      setDeleteOpen(true);
                    }}
                  >
                    Delete Customer
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      <Modal
        open={deleteOpen}
        title="Delete Customer"
        onClose={() => {
          setDeleteOpen(false);
        }}
      >
        {!customerDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Customer tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus customer <span className="font-medium">{customerDetailQuery.data.customerNumber}</span> —{" "}
              <span className="font-medium">{customerDetailQuery.data.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-lg border-border bg-background"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-lg"
                disabled={deleteMutation.isPending}
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync({ id: customerDetailQuery.data.id });
                    toast.success("Customer dihapus");
                    setDeleteOpen(false);
                    setEditOpen(false);
                    setSelectedCustomerId(null);
                    if (lastCustomer?.id === customerDetailQuery.data.id) {
                      setLastCustomer(null);
                    }
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal menghapus customer");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
