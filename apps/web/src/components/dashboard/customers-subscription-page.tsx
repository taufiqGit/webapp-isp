import type { AppRouter } from "@isp-app/api/routers/index";
import { Button } from "@isp-app/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@isp-app/ui/components/card";
import { Input } from "@isp-app/ui/components/input";
import { Label } from "@isp-app/ui/components/label";
import { Skeleton } from "@isp-app/ui/components/skeleton";
import { cn } from "@isp-app/ui/lib/utils";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { Ban, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import Modal from "./modal";
import { computeNextMonthlyFeeInput } from "@/utils/plan-autofill";
import { queryClient, trpc } from "@/utils/trpc";

type CustomerRow = inferRouterOutputs<AppRouter>["customer"]["list"]["items"][number];
type CustomerStatus = CustomerRow["status"];
type SubscriptionRow = inferRouterOutputs<AppRouter>["subscription"]["listByCustomer"]["items"][number];
type PlanRow = inferRouterOutputs<AppRouter>["plan"]["listActive"]["items"][number];

type SubscriptionStatus = SubscriptionRow["status"];

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

function formatDateTimeId(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  date.setHours(23, 0, 0, 0);
  return date
    .toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    .replace(",", "");
}

export default function CustomersSubscriptionPage({ preselectCustomerId }: { preselectCustomerId?: string }) {
  const navigate = useNavigate();
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(preselectCustomerId ?? null);

  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createCustomerName, setCreateCustomerName] = useState("");
  const [createCustomerEmail, setCreateCustomerEmail] = useState("");
  const [createCustomerPhone, setCreateCustomerPhone] = useState("");
  const [createCustomerType, setCreateCustomerType] = useState<"individual" | "business">("individual");

  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerEmail, setEditCustomerEmail] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editCustomerType, setEditCustomerType] = useState<"individual" | "business">("individual");

  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [priceMonthly, setPriceMonthly] = useState<string>("");
  const autoMonthlyFeeRef = useRef<number | null>(null);

  const [terminateCustomerOpen, setTerminateCustomerOpen] = useState(false);
  const [terminateCustomerTarget, setTerminateCustomerTarget] = useState<{ id: string; customerNumber: string } | null>(
    null,
  );

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

  useEffect(() => {
    const customer = selectedCustomerQuery.data;
    if (!customer || !editCustomerOpen) return;
    setEditCustomerName(customer.name);
    setEditCustomerType(customer.type);
    setEditCustomerEmail(customer.email ?? "");
    setEditCustomerPhone(customer.phone ?? "");
  }, [selectedCustomerQuery.data, editCustomerOpen]);

  const subscriptionsQuery = useQuery(
    trpc.subscription.listByCustomer.queryOptions(
      selectedCustomerId ? { customerId: selectedCustomerId } : skipToken,
    ),
  );

  const subscriptions = subscriptionsQuery.data?.items ?? [];
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "active");
  const suspendedSubscriptions = subscriptions.filter((sub) => sub.status === "suspended");
  const hasActiveSubscriptions = activeSubscriptions.length > 0;

  const plansQuery = useQuery({
    ...trpc.plan.listActive.queryOptions(),
    enabled: addOpen,
    staleTime: 0,
  });
  const plans = plansQuery.data?.items ?? [];

  const selectedPlan: PlanRow | undefined = useMemo(() => {
    if (!packageId) return undefined;
    return plans.find((row) => row.id === packageId);
  }, [packageId, plans]);

  useEffect(() => {
    if (!addOpen) return;
    if (plans.length === 0) return;
    if (!packageId || (packageId && !selectedPlan)) {
      setPackageId(plans[0]!.id);
    }
  }, [addOpen, packageId, plans, selectedPlan]);

  useEffect(() => {
    if (!addOpen) return;
    if (!selectedPlan) return;

    setPriceMonthly((previousInput) => {
      const result = computeNextMonthlyFeeInput({
        previousInput,
        previousAutoValue: autoMonthlyFeeRef.current,
        nextAutoValue: selectedPlan.priceMonthly,
      });
      autoMonthlyFeeRef.current = result.nextAutoValue;
      return result.nextInput;
    });
  }, [addOpen, selectedPlan?.id, selectedPlan?.priceMonthly]);

  const selectCustomer = (customerId: string | null) => {
    setSelectedCustomerId(customerId);
    navigate({
      to: "/customers",
      search: customerId ? { customerId } : {},
      replace: true,
    });
  };

  const invalidateCustomerData = async (overrideCustomerId?: string | null) => {
    const customerId = overrideCustomerId ?? selectedCustomerId;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.customer.list.queryKey(listInput) }),
      customerId
        ? queryClient.invalidateQueries({ queryKey: trpc.customer.byId.queryKey({ id: customerId }) })
        : Promise.resolve(),
      customerId
        ? queryClient.invalidateQueries({
          queryKey: trpc.subscription.listByCustomer.queryKey({ customerId }),
        })
        : Promise.resolve(),
    ]);
  };

  const createCustomerMutation = useMutation(trpc.customer.create.mutationOptions());
  const updateCustomerMutation = useMutation(
    trpc.customer.update.mutationOptions({
      onSuccess: () => invalidateCustomerData(),
    }),
  );
  const deleteCustomerMutation = useMutation(
    trpc.customer.delete.mutationOptions({
      onSuccess: () => invalidateCustomerData(),
    }),
  );

  const createSubscriptionMutation = useMutation(
    trpc.subscription.create.mutationOptions({
      onSuccess: () => invalidateCustomerData(),
    }),
  );

  const setSubscriptionStatusMutation = useMutation(
    trpc.subscription.setStatus.mutationOptions({
      onSuccess: () => invalidateCustomerData(),
    }),
  );

  const deleteSubscriptionMutation = useMutation(
    trpc.subscription.delete.mutationOptions({
      onSuccess: () => invalidateCustomerData(),
    }),
  );

  const clearSubscriptionsMutation = useMutation(
    trpc.subscription.clearByCustomer.mutationOptions({
      onSuccess: () => invalidateCustomerData(),
    }),
  );

  const terminateCustomerMutation = useMutation(
    trpc.customer.setTerminated.mutationOptions({
      onSuccess: () => invalidateCustomerData(),
    }),
  );

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[460px_1fr]">
      <Card className="min-h-0 bg-background">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Customers</span>
            <Button
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setCreateCustomerOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Add Customer
            </Button>
          </CardTitle>
          <p className="text-xs text-muted-foreground">Registry customer, detail, dan subscriptions dalam satu halaman.</p>
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
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Active Subs</th>
                  <th className="py-2 font-medium">Next Payment</th>
                  <th className="py-2 text-right font-medium">Total Biaya</th>
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
                      <td className="py-3">
                        <Skeleton className="h-3 w-10" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-20" />
                      </td>
                      <td className="py-3 text-right">
                        <Skeleton className="ml-auto h-3 w-20" />
                      </td>
                      <td className="py-3 text-right">
                        <Skeleton className="ml-auto h-7 w-20" />
                      </td>
                    </tr>
                  ))
                  : customers.map((row) => {
                      const isSelected = selectedCustomerId === row.id;
                      const canTerminate = row.status === "suspended" && (row.totalActiveSubscriptions ?? 0) === 0;
                      return (
                        <tr
                          key={row.id}
                          className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/20", isSelected && "bg-muted/30")}
                          onClick={() => {
                            selectCustomer(row.id);
                          }}
                        >
                          <td className="py-3 w-40">
                            <p className="font-medium">{row.name}</p>
                            <p className="text-muted-foreground">{row.customerNumber}</p>
                          </td>
                          <td className="py-3">
                            <span className={cn("font-medium", statusToneMap[row.status])}>{row.status}</span>
                          </td>
                          <td className="py-3">{row.totalActiveSubscriptions ?? 0}</td>
                          <td className="py-3">{formatDateTimeId(row.nextPaymentDate)}</td>
                          <td className="py-3 text-right font-medium text-emerald-500">
                            {row.totalSubscriptionCost ? formatCurrency(row.totalSubscriptionCost) : "-"}
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="rounded-lg"
                              disabled={!canTerminate}
                              onClick={(event) => {
                                event.stopPropagation();
                                setTerminateCustomerTarget({ id: row.id, customerNumber: row.customerNumber });
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
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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
            <span className="min-w-0">
              <span className="block truncate">Customer</span>
              {selectedCustomerQuery.data ? (
                <span className="block truncate text-xs font-medium text-muted-foreground">
                  {selectedCustomerQuery.data.customerNumber} — {selectedCustomerQuery.data.name}
                </span>
              ) : (
                <span className="block text-xs font-medium text-muted-foreground">Pilih customer</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {selectedCustomerId ? `${subscriptions.length} subscriptions` : "-"}
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
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg border-border bg-background"
                disabled={!selectedCustomerId}
                onClick={() => setEditCustomerOpen(true)}
              >
                Edit Customer
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
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Profile</Label>
                      <div className="grid gap-1 text-xs text-muted-foreground">
                        <p>
                          Type: <span className="font-medium text-foreground">{selectedCustomerQuery.data.type}</span>
                        </p>
                        <p>
                          Email: <span className="font-medium text-foreground">{selectedCustomerQuery.data.email ?? "-"}</span>
                        </p>
                        <p>
                          Phone: <span className="font-medium text-foreground">{selectedCustomerQuery.data.phone ?? "-"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Metrics</Label>
                      <div className="grid gap-1 text-xs text-muted-foreground">
                        <p>
                          Active Subs:{" "}
                          <span className="font-medium text-foreground">
                            {selectedCustomerQuery.data.totalActiveSubscriptions ?? 0}
                          </span>
                        </p>
                        <p>
                          Next Payment:{" "}
                          <span className="font-medium text-foreground">{formatDateTimeId(selectedCustomerQuery.data.nextPaymentDate)}</span>
                        </p>
                        <p>
                          Total Biaya:{" "}
                          <span className="font-medium text-emerald-500">
                            {selectedCustomerQuery.data.totalSubscriptionCost
                              ? formatCurrency(selectedCustomerQuery.data.totalSubscriptionCost)
                              : "-"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Rule</Label>
                      <p className="text-xs text-muted-foreground">
                        Customer menjadi suspended jika semua subscription suspended atau dihapus. Terminated hanya bisa jika customer suspended dan tidak ada subscription aktif.
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
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-lg"
                          disabled={selectedCustomerQuery.data.status !== "suspended" || hasActiveSubscriptions}
                          onClick={() => {
                            setTerminateCustomerTarget({
                              id: selectedCustomerQuery.data.id,
                              customerNumber: selectedCustomerQuery.data.customerNumber,
                            });
                            setTerminateCustomerOpen(true);
                          }}
                        >
                          Terminate customer
                        </Button>
                      </div>
                    </div>
                    {selectedCustomerQuery.data.status === "terminated" ? (
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
                              setDeleteCustomerOpen(true);
                            }}
                          >
                            Delete Customer
                          </Button>
                        </div>
                      </div>
                    ) : null}
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
                              <td className="py-3">
                                {sub.endDate
                                  ? new Date(sub.endDate)
                                    .toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                    .replace(",", "")
                                  : "-"}
                              </td>
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

                    <div className="mt-4 mb-4 border-t pt-3">
                      <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2">
                        <div></div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Next Payment</p>
                          <p className="mt-1 text-sm font-medium">
                            {activeSubscriptions.length > 0
                              ? (() => {
                                const now = new Date();
                                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 10, 23, 0, 0);
                                return nextMonth.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
                              })()
                              : '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">Total Biaya</p>
                          <p className="mt-1 text-sm font-medium text-emerald-500">
                            {selectedCustomerQuery.data?.totalSubscriptionCost
                              ? formatCurrency(selectedCustomerQuery.data.totalSubscriptionCost)
                              : '-'}
                          </p>
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </div>
                  {hasActiveSubscriptions ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      *Customer tidak bisa menjadi suspended/terminated jika masih ada subscription aktif.
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
        open={createCustomerOpen}
        title="Create Customer"
        onClose={() => {
          setCreateCustomerOpen(false);
        }}
      >
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmedName = createCustomerName.trim();
            if (!trimmedName.length) {
              toast.error("Nama customer wajib diisi");
              return;
            }
            try {
              const created = await createCustomerMutation.mutateAsync({
                name: trimmedName,
                email: createCustomerEmail.trim().length ? createCustomerEmail.trim() : undefined,
                phone: createCustomerPhone.trim().length ? createCustomerPhone.trim() : undefined,
                type: createCustomerType,
              });

              await invalidateCustomerData(created.id);
              selectCustomer(created.id);
              setCreateCustomerOpen(false);
              setCreateCustomerName("");
              setCreateCustomerEmail("");
              setCreateCustomerPhone("");
              setCreateCustomerType("individual");

              toast.success("Customer berhasil dibuat", {
                action: {
                  label: "Add subscription",
                  onClick: () => setAddOpen(true),
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
              value={createCustomerName}
              onChange={(event) => setCreateCustomerName(event.target.value)}
              placeholder="Contoh: Budi Santoso / PT. Nusantara Net"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-customer-type">Type</Label>
            <select
              id="create-customer-type"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={createCustomerType}
              onChange={(event) => setCreateCustomerType(event.target.value as "individual" | "business")}
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
              value={createCustomerEmail}
              onChange={(event) => setCreateCustomerEmail(event.target.value)}
              placeholder="opsional"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-customer-phone">Phone</Label>
            <Input
              id="create-customer-phone"
              value={createCustomerPhone}
              onChange={(event) => setCreateCustomerPhone(event.target.value)}
              placeholder="opsional"
            />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-border bg-background"
              onClick={() => {
                setCreateCustomerOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg" disabled={createCustomerMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editCustomerOpen}
        title="Edit Customer"
        onClose={() => {
          setEditCustomerOpen(false);
        }}
      >
        {selectedCustomerQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : selectedCustomerQuery.isError || !selectedCustomerQuery.data ? (
          <p className="text-sm text-muted-foreground">Customer tidak ditemukan.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await updateCustomerMutation.mutateAsync({
                  id: selectedCustomerQuery.data.id,
                  name: editCustomerName.trim(),
                  type: editCustomerType,
                  email: editCustomerEmail.trim().length ? editCustomerEmail.trim() : null,
                  phone: editCustomerPhone.trim().length ? editCustomerPhone.trim() : null,
                });
                toast.success("Customer berhasil disimpan");
                setEditCustomerOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan customer");
              }
            }}
          >
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-customer-name">Name</Label>
              <Input
                id="edit-customer-name"
                value={editCustomerName}
                onChange={(event) => setEditCustomerName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-customer-type">Type</Label>
              <select
                id="edit-customer-type"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editCustomerType}
                onChange={(event) => setEditCustomerType(event.target.value as "individual" | "business")}
              >
                <option value="individual">Individual</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Input value={selectedCustomerQuery.data.status} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Total Active Subscriptions</Label>
              <Input value={selectedCustomerQuery.data.totalActiveSubscriptions ?? 0} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Next Payment Date</Label>
              <Input value={formatDateTimeId(selectedCustomerQuery.data.nextPaymentDate)} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Total Subscription Cost</Label>
              <Input
                value={selectedCustomerQuery.data.totalSubscriptionCost ? formatCurrency(selectedCustomerQuery.data.totalSubscriptionCost) : "-"}
                readOnly
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-customer-email">Email</Label>
              <Input
                id="edit-customer-email"
                value={editCustomerEmail}
                onChange={(event) => setEditCustomerEmail(event.target.value)}
                placeholder="opsional"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-customer-phone">Phone</Label>
              <Input
                id="edit-customer-phone"
                value={editCustomerPhone}
                onChange={(event) => setEditCustomerPhone(event.target.value)}
                placeholder="opsional"
              />
            </div>
            <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-border bg-background"
                onClick={() => {
                  setEditCustomerOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg" disabled={updateCustomerMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={deleteCustomerOpen}
        title="Delete Customer"
        onClose={() => {
          setDeleteCustomerOpen(false);
        }}
      >
        {selectedCustomerQuery.isError || !selectedCustomerQuery.data ? (
          <p className="text-sm text-muted-foreground">Customer tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus customer <span className="font-medium">{selectedCustomerQuery.data.customerNumber}</span> —{" "}
              <span className="font-medium">{selectedCustomerQuery.data.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-lg border-border bg-background"
                onClick={() => setDeleteCustomerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-lg"
                disabled={deleteCustomerMutation.isPending}
                onClick={async () => {
                  try {
                    await deleteCustomerMutation.mutateAsync({ id: selectedCustomerQuery.data.id });
                    toast.success("Customer dihapus");
                    setDeleteCustomerOpen(false);
                    selectCustomer(null);
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

      <Modal
        open={addOpen}
        title={selectedCustomerQuery.data ? `Add Subscription — ${selectedCustomerQuery.data.customerNumber}` : "Add Subscription"}
        onClose={() => {
          setAddOpen(false);
          autoMonthlyFeeRef.current = null;
          setPriceMonthly("");
          setPackageId("");
        }}
      >
        {!selectedCustomerId ? (
          <p className="text-sm text-muted-foreground">Pilih customer terlebih dahulu.</p>
        ) : plansQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : plansQuery.isError ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Gagal memuat package dari Master Plan.</p>
            <p className="text-xs text-destructive">{plansQuery.error.message}</p>
          </div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada package aktif. Tambahkan dulu di Master → Plan.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const plan = selectedPlan;
              if (!plan) {
                toast.error("Package tidak valid atau sudah tidak tersedia");
                return;
              }

              const normalizedPrice = priceMonthly.trim().length ? Number(priceMonthly.trim()) : NaN;
              const parsedPrice = Number.isFinite(normalizedPrice) ? normalizedPrice : undefined;

              try {
                await createSubscriptionMutation.mutateAsync({
                  customerId: selectedCustomerId,
                  packageId: plan.id,
                  packageName: `${plan.name} (${plan.speedMbps} Mbps)`,
                  startDate,
                  priceMonthly: parsedPrice,
                });
                toast.success("Subscription ditambahkan");
                setAddOpen(false);
                setPriceMonthly("");
                setPackageId("");
                autoMonthlyFeeRef.current = null;
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menambahkan subscription");
              }
            }}
          >
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="subscription-package">Package</Label>
              <select
                id="subscription-package"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={packageId}
                onChange={(event) => {
                  setPackageId(event.target.value);
                }}
              >
                <option value="">Pilih package</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — {plan.speedMbps} Mbps — {formatCurrency(plan.priceMonthly)}
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
              <Label htmlFor="subscription-price">Monthly fee</Label>
              <Input
                id="subscription-price"
                inputMode="numeric"
                value={priceMonthly}
                disabled
                placeholder="contoh: 299000"
              />
            </div>
            <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-border bg-background"
                onClick={() => {
                  setAddOpen(false);
                  autoMonthlyFeeRef.current = null;
                  setPriceMonthly("");
                  setPackageId("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-lg"
                disabled={createSubscriptionMutation.isPending || !selectedPlan}
              >
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
