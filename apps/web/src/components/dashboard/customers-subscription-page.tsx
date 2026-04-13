import type { AppRouter } from "@isp-app/api/routers/index";
import { Button } from "@isp-app/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@isp-app/ui/components/card";
import { Input } from "@isp-app/ui/components/input";
import { Label } from "@isp-app/ui/components/label";
import { Skeleton } from "@isp-app/ui/components/skeleton";
import { cn } from "@isp-app/ui/lib/utils";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { Ban, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import Modal from "./modal";
import { queryClient, trpc } from "@/utils/trpc";

type CustomerRow = inferRouterOutputs<AppRouter>["customer"]["list"]["items"][number];
type CustomerStatus = CustomerRow["status"];
type SubscriptionRow = inferRouterOutputs<AppRouter>["subscription"]["listByCustomer"]["items"][number];

type SubscriptionStatus = SubscriptionRow["status"];

interface DummyPackage {
  id: string;
  name: string;
  speedLabel: string;
  priceMonthly: number;
}

const dummyPackages: DummyPackage[] = [
  { id: "pkg_fiber_50", name: "Fiber Home 50", speedLabel: "50 Mbps", priceMonthly: 299000 },
  { id: "pkg_fiber_100", name: "Fiber Home 100", speedLabel: "100 Mbps", priceMonthly: 399000 },
  { id: "pkg_biz_200", name: "Business 200", speedLabel: "200 Mbps", priceMonthly: 1299000 },
];

const statusToneMap: Record<CustomerStatus, string> = {
  prospect: "text-muted-foreground",
  active: "text-emerald-500",
  suspended: "text-amber-500",
  terminated: "text-rose-500",
};

const subscriptionToneMap: Record<SubscriptionStatus, string> = {
  active: "text-emerald-500",
  suspended: "text-amber-500",
  terminated: "text-rose-500",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value);
}

export default function CustomersSubscriptionPage({ preselectCustomerId }: { preselectCustomerId?: string }) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(preselectCustomerId ?? null);

  const [addOpen, setAddOpen] = useState(false);
  const [packageId, setPackageId] = useState(dummyPackages[0]?.id ?? "");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [priceMonthly, setPriceMonthly] = useState<string>("");

  const [terminateCustomerOpen, setTerminateCustomerOpen] = useState(false);
  const [terminateCustomerTarget, setTerminateCustomerTarget] = useState<CustomerRow | null>(null);

  const listInput = useMemo(() => {
    const trimmed = customerQuery.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 50,
      offset: 0,
    };
  }, [customerQuery]);

  const customersQuery = useQuery(trpc.customer.list.queryOptions(listInput));
  const customers = customersQuery.data?.items ?? [];

  const selectedCustomerQuery = useQuery(
    trpc.customer.byId.queryOptions(selectedCustomerId ? { id: selectedCustomerId } : skipToken),
  );

  useEffect(() => {
    if (preselectCustomerId) {
      setSelectedCustomerId(preselectCustomerId);
    }
  }, [preselectCustomerId]);

  const subscriptionsQuery = useQuery(
    trpc.subscription.listByCustomer.queryOptions(
      selectedCustomerId ? { customerId: selectedCustomerId } : skipToken,
    ),
  );

  const subscriptions = subscriptionsQuery.data?.items ?? [];
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "active");
  const suspendedSubscriptions = subscriptions.filter((sub) => sub.status === "suspended");
  const hasActiveSubscriptions = activeSubscriptions.length > 0;

  const invalidateCustomerData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.customer.list.queryKey(listInput) }),
      selectedCustomerId
        ? queryClient.invalidateQueries({ queryKey: trpc.customer.byId.queryKey({ id: selectedCustomerId }) })
        : Promise.resolve(),
      selectedCustomerId
        ? queryClient.invalidateQueries({
            queryKey: trpc.subscription.listByCustomer.queryKey({ customerId: selectedCustomerId }),
          })
        : Promise.resolve(),
    ]);
  };

  const createSubscriptionMutation = useMutation(
    trpc.subscription.create.mutationOptions({
      onSuccess: invalidateCustomerData,
    }),
  );

  const setSubscriptionStatusMutation = useMutation(
    trpc.subscription.setStatus.mutationOptions({
      onSuccess: invalidateCustomerData,
    }),
  );

  const deleteSubscriptionMutation = useMutation(
    trpc.subscription.delete.mutationOptions({
      onSuccess: invalidateCustomerData,
    }),
  );

  const clearSubscriptionsMutation = useMutation(
    trpc.subscription.clearByCustomer.mutationOptions({
      onSuccess: invalidateCustomerData,
    }),
  );

  const terminateCustomerMutation = useMutation(
    trpc.customer.setTerminated.mutationOptions({
      onSuccess: invalidateCustomerData,
    }),
  );

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[460px_1fr]">
      <Card className="min-h-0 bg-background">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm">Select Customer</CardTitle>
          <p className="text-xs text-muted-foreground">Kelola langganan customer dan lifecycle statusnya.</p>
        </CardHeader>
        <CardContent className="min-h-0 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              className="pl-9"
              placeholder="Cari nama / nomor / email / telp"
            />
          </div>

          <div className="mt-3 min-h-0 overflow-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {customersQuery.isLoading
                  ? new Array(8).fill(null).map((_, index) => (
                      <tr key={`customer-skeleton-${index}`} className="border-b last:border-0">
                        <td className="py-3">
                          <Skeleton className="mb-1 h-3 w-44" />
                          <Skeleton className="h-3 w-20" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-20" />
                        </td>
                        <td className="py-3 text-right">
                          <Skeleton className="ml-auto h-7 w-20" />
                        </td>
                      </tr>
                    ))
                  : customers.map((row) => {
                      const isSelected = selectedCustomerId === row.id;
                      const canTerminate = row.status === "suspended";
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            "border-b last:border-0 hover:bg-muted/20",
                            isSelected && "bg-muted/30",
                          )}
                        >
                          <td
                            className="cursor-pointer py-3"
                            onClick={() => {
                              setSelectedCustomerId(row.id);
                            }}
                          >
                            <p className="font-medium">{row.name}</p>
                            <p className="text-muted-foreground">{row.customerNumber}</p>
                          </td>
                          <td
                            className="cursor-pointer py-3"
                            onClick={() => {
                              setSelectedCustomerId(row.id);
                            }}
                          >
                            <span className={cn("font-medium", statusToneMap[row.status])}>{row.status}</span>
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="rounded-lg"
                              disabled={!canTerminate}
                              onClick={() => {
                                setTerminateCustomerTarget(row);
                                setTerminateCustomerOpen(true);
                              }}
                            >
                              Terminate
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                {!customersQuery.isLoading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      Tidak ada customer ditemukan.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-0 bg-background">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Subscriptions</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {selectedCustomerId ? `${subscriptions.length} total` : "Pilih customer"}
              </span>
              <Button
                size="sm"
                className="rounded-lg"
                disabled={!selectedCustomerId}
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 size-4" />
                Add Subscription
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 pt-3">
          {!selectedCustomerId ? (
            <div className="grid place-content-center py-16 text-sm text-muted-foreground">
              Pilih customer dari panel kiri untuk melihat langganan.
            </div>
          ) : selectedCustomerQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : selectedCustomerQuery.isError || !selectedCustomerQuery.data ? (
            <p className="text-sm text-muted-foreground">Customer tidak ditemukan.</p>
          ) : (
            <div className="grid min-h-0 gap-3 grid-rows-[auto_auto_1fr]">
              <Card className="bg-background" size="sm">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{selectedCustomerQuery.data.name}</span>
                    <span className={cn("text-xs font-medium", statusToneMap[selectedCustomerQuery.data.status])}>
                      {selectedCustomerQuery.data.status}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{selectedCustomerQuery.data.customerNumber}</p>
                </CardHeader>
                <CardContent className="grid gap-3 pt-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Rule</Label>
                    <p className="text-xs text-muted-foreground">
                      Customer menjadi suspended jika semua subscription suspended atau dihapus. Terminated dilakukan manual dari panel kiri.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label>Quick Actions</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-border bg-background"
                        disabled={activeSubscriptions.length === 0}
                        onClick={async () => {
                          try {
                            for (const sub of activeSubscriptions) {
                              await setSubscriptionStatusMutation.mutateAsync({ id: sub.id, status: "suspended" });
                            }
                            toast.success("Subscription aktif disuspend");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Gagal suspend subscription");
                          }
                        }}
                      >
                        <Ban className="mr-2 size-4" />
                        Suspend active
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-border bg-background"
                        disabled={hasActiveSubscriptions}
                        onClick={async () => {
                          try {
                            await clearSubscriptionsMutation.mutateAsync({ customerId: selectedCustomerId });
                            toast.success("Semua subscription dihapus");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Gagal menghapus subscription");
                          }
                        }}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete all
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background" size="sm">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm">Subscription List</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  {subscriptionsQuery.isError ? (
                    <p className="text-xs text-destructive">{subscriptionsQuery.error.message}</p>
                  ) : null}
                  <div className="mt-1 min-h-0 overflow-auto">
                    <table className="w-full min-w-[920px] text-left text-xs">
                      <thead className="text-muted-foreground">
                        <tr className="border-b">
                          <th className="py-2 font-medium">Package</th>
                          <th className="py-2 font-medium">Status</th>
                          <th className="py-2 font-medium">Start</th>
                          <th className="py-2 font-medium">End</th>
                          <th className="py-2 text-right font-medium">Monthly</th>
                          <th className="py-2 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptionsQuery.isLoading
                          ? new Array(6).fill(null).map((_, index) => (
                              <tr key={`sub-skeleton-${index}`} className="border-b last:border-0">
                                <td className="py-3">
                                  <Skeleton className="mb-1 h-3 w-48" />
                                  <Skeleton className="h-3 w-20" />
                                </td>
                                <td className="py-3">
                                  <Skeleton className="h-3 w-20" />
                                </td>
                                <td className="py-3">
                                  <Skeleton className="h-3 w-20" />
                                </td>
                                <td className="py-3">
                                  <Skeleton className="h-3 w-20" />
                                </td>
                                <td className="py-3 text-right">
                                  <Skeleton className="ml-auto h-3 w-20" />
                                </td>
                                <td className="py-3 text-right">
                                  <Skeleton className="ml-auto h-7 w-44" />
                                </td>
                              </tr>
                            ))
                          : subscriptions.map((sub) => (
                              <tr key={sub.id} className="border-b last:border-0">
                                <td className="py-3">
                                  <p className="font-medium">{sub.packageName}</p>
                                  <p className="text-muted-foreground">{sub.packageId}</p>
                                </td>
                                <td className="py-3">
                                  <span className={cn("font-medium", subscriptionToneMap[sub.status])}>
                                    {sub.status}
                                  </span>
                                </td>
                                <td className="py-3">{new Date(sub.startDate).toLocaleDateString()}</td>
                                <td className="py-3">{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "-"}</td>
                                <td className="py-3 text-right font-medium">
                                  {sub.priceMonthly ? formatCurrency(sub.priceMonthly) : "-"}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    {sub.status === "active" ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg border-border bg-background"
                                        onClick={async () => {
                                          try {
                                            await setSubscriptionStatusMutation.mutateAsync({
                                              id: sub.id,
                                              status: "suspended",
                                            });
                                          } catch (error) {
                                            toast.error(error instanceof Error ? error.message : "Gagal suspend");
                                          }
                                        }}
                                      >
                                        Suspend
                                      </Button>
                                    ) : sub.status === "suspended" ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg border-border bg-background"
                                        onClick={async () => {
                                          try {
                                            await setSubscriptionStatusMutation.mutateAsync({
                                              id: sub.id,
                                              status: "active",
                                            });
                                          } catch (error) {
                                            toast.error(error instanceof Error ? error.message : "Gagal activate");
                                          }
                                        }}
                                      >
                                        Activate
                                      </Button>
                                    ) : null}
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="rounded-lg"
                                      disabled={sub.status === "terminated"}
                                      onClick={async () => {
                                        try {
                                          await setSubscriptionStatusMutation.mutateAsync({
                                            id: sub.id,
                                            status: "terminated",
                                          });
                                        } catch (error) {
                                          toast.error(error instanceof Error ? error.message : "Gagal terminate");
                                        }
                                      }}
                                    >
                                      Terminate
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-lg border-border bg-background"
                                      disabled={sub.status === "active"}
                                      onClick={async () => {
                                        try {
                                          await deleteSubscriptionMutation.mutateAsync({ id: sub.id });
                                        } catch (error) {
                                          toast.error(error instanceof Error ? error.message : "Gagal delete");
                                        }
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        {!subscriptionsQuery.isLoading && subscriptions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                              Belum ada subscription untuk customer ini.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                  {hasActiveSubscriptions ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Customer tidak bisa menjadi suspended/terminated jika masih ada subscription aktif.
                    </p>
                  ) : suspendedSubscriptions.length > 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Semua subscription non-aktif akan membuat customer menjadi suspended otomatis.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={addOpen}
        title={selectedCustomerQuery.data ? `Add Subscription — ${selectedCustomerQuery.data.customerNumber}` : "Add Subscription"}
        onClose={() => setAddOpen(false)}
      >
        {!selectedCustomerId ? (
          <p className="text-sm text-muted-foreground">Pilih customer terlebih dahulu.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const pkg = dummyPackages.find((item) => item.id === packageId);
              if (!pkg) {
                toast.error("Paket tidak valid");
                return;
              }

              const normalizedPrice = priceMonthly.trim().length ? Number(priceMonthly.trim()) : NaN;
              const parsedPrice = Number.isFinite(normalizedPrice) ? normalizedPrice : undefined;

              try {
                await createSubscriptionMutation.mutateAsync({
                  customerId: selectedCustomerId,
                  packageId: pkg.id,
                  packageName: `${pkg.name} (${pkg.speedLabel})`,
                  startDate,
                  priceMonthly: parsedPrice,
                });
                toast.success("Subscription ditambahkan");
                setAddOpen(false);
                setPriceMonthly("");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menambahkan subscription");
              }
            }}
          >
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="subscription-package">Package (dummy)</Label>
              <select
                id="subscription-package"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={packageId}
                onChange={(event) => setPackageId(event.target.value)}
              >
                {dummyPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — {pkg.speedLabel} — {formatCurrency(pkg.priceMonthly)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="subscription-start">Start date</Label>
              <Input
                id="subscription-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subscription-price">Monthly fee (optional)</Label>
              <Input
                id="subscription-price"
                inputMode="numeric"
                value={priceMonthly}
                onChange={(event) => setPriceMonthly(event.target.value)}
                placeholder="contoh: 299000"
              />
            </div>
            <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-border bg-background"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg" disabled={createSubscriptionMutation.isPending}>
                Add
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={terminateCustomerOpen}
        title="Terminate Customer"
        onClose={() => {
          setTerminateCustomerOpen(false);
          setTerminateCustomerTarget(null);
        }}
      >
        {!terminateCustomerTarget ? (
          <p className="text-sm text-muted-foreground">Customer tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Ubah status customer <span className="font-medium">{terminateCustomerTarget.customerNumber}</span> menjadi{" "}
              <span className="font-medium">terminated</span>?
            </p>
            <p className="text-xs text-muted-foreground">
              Hanya bisa jika customer sudah suspended dan tidak ada subscription aktif.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-lg border-border bg-background"
                onClick={() => {
                  setTerminateCustomerOpen(false);
                  setTerminateCustomerTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-lg"
                disabled={terminateCustomerMutation.isPending}
                onClick={async () => {
                  try {
                    await terminateCustomerMutation.mutateAsync({ id: terminateCustomerTarget.id });
                    toast.success("Customer terminated");
                    setTerminateCustomerOpen(false);
                    setTerminateCustomerTarget(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal terminate customer");
                  }
                }}
              >
                Terminate
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
