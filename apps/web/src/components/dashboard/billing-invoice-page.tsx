import { Button } from "@isp-app/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@isp-app/ui/components/card";
import { Input } from "@isp-app/ui/components/input";
import { Label } from "@isp-app/ui/components/label";
import { Skeleton } from "@isp-app/ui/components/skeleton";
import { cn } from "@isp-app/ui/lib/utils";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import DashboardShell from "./dashboard-shell";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardTopbar from "./dashboard-topbar";
import Modal from "./modal";
import { queryClient, trpc } from "@/utils/trpc";

type InvoiceStatus = "draft" | "issued" | "partial" | "paid" | "overdue" | "cancelled" | "void";
type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value);
}

function toDateInput(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
}

function toDateTimeInput(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function BillingInvoicePage({ userName }: { userName?: string }) {
  const [activeTab, setActiveTab] = useState<"invoice" | "payment">("invoice");
  const [query, setQuery] = useState("");

  const [invoiceCreateOpen, setInvoiceCreateOpen] = useState(false);
  const [invoiceEditOpen, setInvoiceEditOpen] = useState(false);
  const [invoiceDeleteOpen, setInvoiceDeleteOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [paymentCreateOpen, setPaymentCreateOpen] = useState(false);
  const [paymentEditOpen, setPaymentEditOpen] = useState(false);
  const [paymentDeleteOpen, setPaymentDeleteOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const [invoiceCustomerId, setInvoiceCustomerId] = useState("");
  const [invoiceBillingCycleId, setInvoiceBillingCycleId] = useState("");
  const [invoicePeriodStart, setInvoicePeriodStart] = useState("");
  const [invoicePeriodEnd, setInvoicePeriodEnd] = useState("");
  const [invoiceIssueDate, setInvoiceIssueDate] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoiceSubtotal, setInvoiceSubtotal] = useState("");
  const [invoiceTaxAmount, setInvoiceTaxAmount] = useState("");
  const [invoiceDiscountAmount, setInvoiceDiscountAmount] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>("draft");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  const [editInvoiceCustomerId, setEditInvoiceCustomerId] = useState("");
  const [editInvoiceBillingCycleId, setEditInvoiceBillingCycleId] = useState("");
  const [editInvoicePeriodStart, setEditInvoicePeriodStart] = useState("");
  const [editInvoicePeriodEnd, setEditInvoicePeriodEnd] = useState("");
  const [editInvoiceIssueDate, setEditInvoiceIssueDate] = useState("");
  const [editInvoiceDueDate, setEditInvoiceDueDate] = useState("");
  const [editInvoiceSubtotal, setEditInvoiceSubtotal] = useState("");
  const [editInvoiceTaxAmount, setEditInvoiceTaxAmount] = useState("");
  const [editInvoiceDiscountAmount, setEditInvoiceDiscountAmount] = useState("");
  const [editInvoicePaidAmount, setEditInvoicePaidAmount] = useState("");
  const [editInvoiceStatus, setEditInvoiceStatus] = useState<InvoiceStatus>("draft");
  const [editInvoiceNotes, setEditInvoiceNotes] = useState("");

  const [paymentCustomerId, setPaymentCustomerId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentInvoiceId, setPaymentInvoiceId] = useState("");
  const [paymentAllocatedAmount, setPaymentAllocatedAmount] = useState("");

  const [editPaymentCustomerId, setEditPaymentCustomerId] = useState("");
  const [editPaymentMethodId, setEditPaymentMethodId] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>("paid");
  const [editPaymentReferenceNumber, setEditPaymentReferenceNumber] = useState("");
  const [editPaymentNotes, setEditPaymentNotes] = useState("");

  const customerListQuery = useQuery(trpc.customer.list.queryOptions({ limit: 100, offset: 0 }));
  const billingCycleListQuery = useQuery(trpc.billingCycle.list.queryOptions({ limit: 100, offset: 0, isActive: true }));
  const paymentMethodListQuery = useQuery(trpc.paymentMethod.list.queryOptions({ limit: 100, offset: 0, isActive: true }));
  const invoiceForPaymentQuery = useQuery(trpc.invoice.list.queryOptions({ limit: 100, offset: 0 }));

  const invoiceListInput = useMemo(() => {
    const trimmed = query.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 20,
      offset: 0,
    };
  }, [query]);
  const paymentListInput = useMemo(() => {
    const trimmed = query.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 20,
      offset: 0,
    };
  }, [query]);

  const invoiceListQuery = useQuery(trpc.invoice.list.queryOptions(invoiceListInput));
  const paymentListQuery = useQuery(trpc.payment.list.queryOptions(paymentListInput));

  const invoiceRows = invoiceListQuery.data?.items ?? [];
  const paymentRows = paymentListQuery.data?.items ?? [];

  const invoiceDetailQuery = useQuery(trpc.invoice.byId.queryOptions(selectedInvoiceId ? { id: selectedInvoiceId } : skipToken));
  const paymentDetailQuery = useQuery(trpc.payment.byId.queryOptions(selectedPaymentId ? { id: selectedPaymentId } : skipToken));

  useEffect(() => {
    const row = invoiceDetailQuery.data;
    if (!row || !invoiceEditOpen) return;
    setEditInvoiceCustomerId(row.customerId);
    setEditInvoiceBillingCycleId(row.billingCycleId ?? "");
    setEditInvoicePeriodStart(toDateInput(row.billingPeriodStart));
    setEditInvoicePeriodEnd(toDateInput(row.billingPeriodEnd));
    setEditInvoiceIssueDate(toDateInput(row.issueDate));
    setEditInvoiceDueDate(toDateInput(row.dueDate));
    setEditInvoiceSubtotal(String(row.subtotal));
    setEditInvoiceTaxAmount(String(row.taxAmount));
    setEditInvoiceDiscountAmount(String(row.discountAmount));
    setEditInvoicePaidAmount(String(row.paidAmount));
    setEditInvoiceStatus(row.status);
    setEditInvoiceNotes(row.notes ?? "");
  }, [invoiceDetailQuery.data, invoiceEditOpen]);

  useEffect(() => {
    const row = paymentDetailQuery.data;
    if (!row || !paymentEditOpen) return;
    setEditPaymentCustomerId(row.customerId);
    setEditPaymentMethodId(row.paymentMethodId ?? "");
    setEditPaymentDate(toDateTimeInput(row.paymentDate));
    setEditPaymentAmount(String(row.amount));
    setEditPaymentStatus(row.status);
    setEditPaymentReferenceNumber(row.referenceNumber ?? "");
    setEditPaymentNotes(row.notes ?? "");
  }, [paymentDetailQuery.data, paymentEditOpen]);

  const invoiceCreateMutation = useMutation(
    trpc.invoice.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.invoice.list.queryKey(invoiceListInput) });
      },
    }),
  );
  const invoiceUpdateMutation = useMutation(
    trpc.invoice.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.invoice.list.queryKey(invoiceListInput) });
      },
    }),
  );
  const invoiceDeleteMutation = useMutation(
    trpc.invoice.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.invoice.list.queryKey(invoiceListInput) });
      },
    }),
  );

  const paymentCreateMutation = useMutation(
    trpc.payment.create.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.payment.list.queryKey(paymentListInput) }),
          queryClient.invalidateQueries({ queryKey: trpc.invoice.list.queryKey(invoiceListInput) }),
        ]);
      },
    }),
  );
  const paymentUpdateMutation = useMutation(
    trpc.payment.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.payment.list.queryKey(paymentListInput) });
      },
    }),
  );
  const paymentDeleteMutation = useMutation(
    trpc.payment.delete.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.payment.list.queryKey(paymentListInput) }),
          queryClient.invalidateQueries({ queryKey: trpc.invoice.list.queryKey(invoiceListInput) }),
        ]);
      },
    }),
  );

  return (
    <DashboardShell
      sidebar={<DashboardSidebar />}
      topbar={<DashboardTopbar userName={userName} title="Billing & Invoices" subtitle="Kelola transaksi invoice dan pembayaran" />}
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === "invoice" ? "secondary" : "outline"}
            size="sm"
            className={cn("rounded-lg", activeTab !== "invoice" && "border-border bg-background")}
            onClick={() => setActiveTab("invoice")}
          >
            Invoice
          </Button>
          <Button
            variant={activeTab === "payment" ? "secondary" : "outline"}
            size="sm"
            className={cn("rounded-lg", activeTab !== "payment" && "border-border bg-background")}
            onClick={() => setActiveTab("payment")}
          >
            Payment
          </Button>
        </div>

        <Card className="bg-background">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>{activeTab === "invoice" ? "Invoice List" : "Payment List"}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {activeTab === "invoice"
                  ? invoiceListQuery.isLoading
                    ? "loading..."
                    : `${invoiceListQuery.data?.total ?? 0} total`
                  : paymentListQuery.isLoading
                    ? "loading..."
                    : `${paymentListQuery.data?.total ?? 0} total`}
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
                  placeholder={activeTab === "invoice" ? "Cari nomor invoice / customer" : "Cari nomor payment / referensi"}
                />
              </div>
              <Button
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  if (activeTab === "invoice") setInvoiceCreateOpen(true);
                  else setPaymentCreateOpen(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                {activeTab === "invoice" ? "Add Invoice" : "Add Payment"}
              </Button>
            </div>

            {activeTab === "invoice" ? (
              <div className="mt-3 min-h-0 overflow-auto">
                <table className="w-full min-w-[1100px] text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-2 font-medium">Invoice No</th>
                      <th className="py-2 font-medium">Customer</th>
                      <th className="py-2 font-medium">Billing Cycle</th>
                      <th className="py-2 font-medium">Issue Date</th>
                      <th className="py-2 font-medium">Due Date</th>
                      <th className="py-2 font-medium text-right">Total</th>
                      <th className="py-2 font-medium text-right">Paid</th>
                      <th className="py-2 font-medium text-right">Balance</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceListQuery.isLoading
                      ? new Array(8).fill(null).map((_, index) => (
                          <tr key={`invoice-skeleton-${index}`} className="border-b last:border-0">
                            <td className="py-3"><Skeleton className="h-3 w-28" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-24" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-20" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-20" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-20" /></td>
                            <td className="py-3"><Skeleton className="ml-auto h-3 w-20" /></td>
                            <td className="py-3"><Skeleton className="ml-auto h-3 w-20" /></td>
                            <td className="py-3"><Skeleton className="ml-auto h-3 w-20" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-16" /></td>
                          </tr>
                        ))
                      : invoiceRows.map((row) => (
                          <tr
                            key={row.id}
                            className="cursor-pointer border-b last:border-0 hover:bg-muted/20"
                            onClick={() => {
                              setSelectedInvoiceId(row.id);
                              setInvoiceEditOpen(true);
                            }}
                          >
                            <td className="py-3 font-medium">{row.invoiceNumber}</td>
                            <td className="py-3">{row.customerName ?? "-"}</td>
                            <td className="py-3">{row.billingCycleName ?? "-"}</td>
                            <td className="py-3">{row.issueDate}</td>
                            <td className="py-3">{row.dueDate}</td>
                            <td className="py-3 text-right font-medium">{formatCurrency(row.totalAmount)}</td>
                            <td className="py-3 text-right">{formatCurrency(row.paidAmount)}</td>
                            <td className="py-3 text-right">{formatCurrency(row.balanceAmount)}</td>
                            <td className="py-3">{row.status}</td>
                          </tr>
                        ))}
                    {!invoiceListQuery.isLoading && invoiceRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                          Belum ada invoice. Klik Add Invoice untuk membuat data pertama.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-3 min-h-0 overflow-auto">
                <table className="w-full min-w-[980px] text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-2 font-medium">Payment No</th>
                      <th className="py-2 font-medium">Customer</th>
                      <th className="py-2 font-medium">Method</th>
                      <th className="py-2 font-medium">Payment Date</th>
                      <th className="py-2 font-medium text-right">Amount</th>
                      <th className="py-2 font-medium">Reference</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentListQuery.isLoading
                      ? new Array(8).fill(null).map((_, index) => (
                          <tr key={`payment-skeleton-${index}`} className="border-b last:border-0">
                            <td className="py-3"><Skeleton className="h-3 w-28" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-24" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-20" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-28" /></td>
                            <td className="py-3"><Skeleton className="ml-auto h-3 w-20" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-20" /></td>
                            <td className="py-3"><Skeleton className="h-3 w-16" /></td>
                          </tr>
                        ))
                      : paymentRows.map((row) => (
                          <tr
                            key={row.id}
                            className="cursor-pointer border-b last:border-0 hover:bg-muted/20"
                            onClick={() => {
                              setSelectedPaymentId(row.id);
                              setPaymentEditOpen(true);
                            }}
                          >
                            <td className="py-3 font-medium">{row.paymentNumber}</td>
                            <td className="py-3">{row.customerName ?? "-"}</td>
                            <td className="py-3">{row.paymentMethodName ?? "-"}</td>
                            <td className="py-3">{new Date(row.paymentDate).toLocaleString("id-ID")}</td>
                            <td className="py-3 text-right font-medium">{formatCurrency(row.amount)}</td>
                            <td className="py-3">{row.referenceNumber ?? "-"}</td>
                            <td className="py-3">{row.status}</td>
                          </tr>
                        ))}
                    {!paymentListQuery.isLoading && paymentRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                          Belum ada payment. Klik Add Payment untuk membuat data pertama.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={invoiceCreateOpen} title="Create Invoice" onClose={() => setInvoiceCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const subtotal = Number(invoiceSubtotal);
            const taxAmount = Number(invoiceTaxAmount || "0");
            const discountAmount = Number(invoiceDiscountAmount || "0");
            if (
              !invoiceCustomerId ||
              !invoicePeriodStart ||
              !invoicePeriodEnd ||
              !invoiceIssueDate ||
              !invoiceDueDate ||
              Number.isNaN(subtotal) ||
              Number.isNaN(taxAmount) ||
              Number.isNaN(discountAmount)
            ) {
              toast.error("Field invoice wajib diisi dengan benar");
              return;
            }
            try {
              await invoiceCreateMutation.mutateAsync({
                customerId: invoiceCustomerId,
                billingCycleId: invoiceBillingCycleId || undefined,
                billingPeriodStart: invoicePeriodStart,
                billingPeriodEnd: invoicePeriodEnd,
                issueDate: invoiceIssueDate,
                dueDate: invoiceDueDate,
                subtotal,
                taxAmount,
                discountAmount,
                status: invoiceStatus,
                notes: invoiceNotes.trim().length ? invoiceNotes.trim() : undefined,
              });
              setInvoiceCreateOpen(false);
              setInvoiceCustomerId("");
              setInvoiceBillingCycleId("");
              setInvoicePeriodStart("");
              setInvoicePeriodEnd("");
              setInvoiceIssueDate("");
              setInvoiceDueDate("");
              setInvoiceSubtotal("");
              setInvoiceTaxAmount("");
              setInvoiceDiscountAmount("");
              setInvoiceStatus("draft");
              setInvoiceNotes("");
              toast.success("Invoice berhasil dibuat");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal membuat invoice");
            }
          }}
        >
          <div className="space-y-1">
            <Label>Customer</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={invoiceCustomerId} onChange={(e) => setInvoiceCustomerId(e.target.value)}>
              <option value="">Pilih Customer</option>
              {(customerListQuery.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.customerNumber} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Billing Cycle</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={invoiceBillingCycleId} onChange={(e) => setInvoiceBillingCycleId(e.target.value)}>
              <option value="">Pilih Billing Cycle</option>
              {(billingCycleListQuery.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Period Start</Label>
            <Input type="date" value={invoicePeriodStart} onChange={(e) => setInvoicePeriodStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Period End</Label>
            <Input type="date" value={invoicePeriodEnd} onChange={(e) => setInvoicePeriodEnd(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Issue Date</Label>
            <Input type="date" value={invoiceIssueDate} onChange={(e) => setInvoiceIssueDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Due Date</Label>
            <Input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Subtotal</Label>
            <Input type="number" min={0} value={invoiceSubtotal} onChange={(e) => setInvoiceSubtotal(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Tax Amount</Label>
            <Input type="number" min={0} value={invoiceTaxAmount} onChange={(e) => setInvoiceTaxAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Discount Amount</Label>
            <Input type="number" min={0} value={invoiceDiscountAmount} onChange={(e) => setInvoiceDiscountAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={invoiceStatus} onChange={(e) => setInvoiceStatus(e.target.value as InvoiceStatus)}>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
              <option value="void">Void</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Notes</Label>
            <Input value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} placeholder="opsional" />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" className="rounded-lg border-border bg-background" onClick={() => setInvoiceCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg" disabled={invoiceCreateMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={invoiceEditOpen}
        title="Edit Invoice"
        onClose={() => {
          setInvoiceEditOpen(false);
          setSelectedInvoiceId(null);
        }}
      >
        {invoiceDetailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : invoiceDetailQuery.isError || !invoiceDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Invoice tidak ditemukan.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const subtotal = Number(editInvoiceSubtotal);
              const taxAmount = Number(editInvoiceTaxAmount);
              const discountAmount = Number(editInvoiceDiscountAmount);
              const paidAmount = Number(editInvoicePaidAmount);
              if ([subtotal, taxAmount, discountAmount, paidAmount].some(Number.isNaN)) {
                toast.error("Nominal invoice harus valid");
                return;
              }
              try {
                await invoiceUpdateMutation.mutateAsync({
                  id: invoiceDetailQuery.data.id,
                  customerId: editInvoiceCustomerId,
                  billingCycleId: editInvoiceBillingCycleId || null,
                  billingPeriodStart: editInvoicePeriodStart,
                  billingPeriodEnd: editInvoicePeriodEnd,
                  issueDate: editInvoiceIssueDate,
                  dueDate: editInvoiceDueDate,
                  subtotal,
                  taxAmount,
                  discountAmount,
                  paidAmount,
                  status: editInvoiceStatus,
                  notes: editInvoiceNotes.trim().length ? editInvoiceNotes.trim() : null,
                });
                toast.success("Invoice berhasil disimpan");
                setInvoiceEditOpen(false);
                setSelectedInvoiceId(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan invoice");
              }
            }}
          >
            <div className="space-y-1 md:col-span-2">
              <Label>Invoice Number</Label>
              <Input value={invoiceDetailQuery.data.invoiceNumber} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Customer</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={editInvoiceCustomerId} onChange={(e) => setEditInvoiceCustomerId(e.target.value)}>
                <option value="">Pilih Customer</option>
                {(customerListQuery.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.customerNumber} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Billing Cycle</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={editInvoiceBillingCycleId} onChange={(e) => setEditInvoiceBillingCycleId(e.target.value)}>
                <option value="">Pilih Billing Cycle</option>
                {(billingCycleListQuery.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Period Start</Label>
              <Input type="date" value={editInvoicePeriodStart} onChange={(e) => setEditInvoicePeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Period End</Label>
              <Input type="date" value={editInvoicePeriodEnd} onChange={(e) => setEditInvoicePeriodEnd(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Issue Date</Label>
              <Input type="date" value={editInvoiceIssueDate} onChange={(e) => setEditInvoiceIssueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={editInvoiceDueDate} onChange={(e) => setEditInvoiceDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Subtotal</Label>
              <Input type="number" min={0} value={editInvoiceSubtotal} onChange={(e) => setEditInvoiceSubtotal(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tax Amount</Label>
              <Input type="number" min={0} value={editInvoiceTaxAmount} onChange={(e) => setEditInvoiceTaxAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Discount Amount</Label>
              <Input type="number" min={0} value={editInvoiceDiscountAmount} onChange={(e) => setEditInvoiceDiscountAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Paid Amount</Label>
              <Input type="number" min={0} value={editInvoicePaidAmount} onChange={(e) => setEditInvoicePaidAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={editInvoiceStatus} onChange={(e) => setEditInvoiceStatus(e.target.value as InvoiceStatus)}>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
                <option value="void">Void</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={editInvoiceNotes} onChange={(e) => setEditInvoiceNotes(e.target.value)} placeholder="opsional" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 md:col-span-2">
              <Button type="button" variant="destructive" className="rounded-lg" onClick={() => setInvoiceDeleteOpen(true)}>
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="rounded-lg border-border bg-background" onClick={() => { setInvoiceEditOpen(false); setSelectedInvoiceId(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg" disabled={invoiceUpdateMutation.isPending}>
                  Save
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={invoiceDeleteOpen} title="Delete Invoice" onClose={() => setInvoiceDeleteOpen(false)}>
        {!invoiceDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Invoice tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus invoice <span className="font-medium">{invoiceDetailQuery.data.invoiceNumber}</span>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" className="rounded-lg border-border bg-background" onClick={() => setInvoiceDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-lg"
                disabled={invoiceDeleteMutation.isPending}
                onClick={async () => {
                  if (!invoiceDetailQuery.data) return;
                  try {
                    await invoiceDeleteMutation.mutateAsync({ id: invoiceDetailQuery.data.id });
                    toast.success("Invoice dihapus");
                    setInvoiceDeleteOpen(false);
                    setInvoiceEditOpen(false);
                    setSelectedInvoiceId(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal menghapus invoice");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={paymentCreateOpen} title="Create Payment" onClose={() => setPaymentCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const amount = Number(paymentAmount);
            const allocatedAmount = Number(paymentAllocatedAmount || "0");
            if (!paymentCustomerId || Number.isNaN(amount)) {
              toast.error("Customer dan Amount wajib valid");
              return;
            }
            if (paymentInvoiceId && (Number.isNaN(allocatedAmount) || allocatedAmount <= 0)) {
              toast.error("Allocated amount harus valid jika memilih invoice");
              return;
            }
            try {
              await paymentCreateMutation.mutateAsync({
                customerId: paymentCustomerId,
                paymentMethodId: paymentMethodId || undefined,
                paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
                amount,
                status: paymentStatus,
                referenceNumber: paymentReferenceNumber.trim().length ? paymentReferenceNumber.trim() : undefined,
                notes: paymentNotes.trim().length ? paymentNotes.trim() : undefined,
                allocations: paymentInvoiceId
                  ? [{ invoiceId: paymentInvoiceId, allocatedAmount: allocatedAmount || amount }]
                  : [],
              });
              setPaymentCreateOpen(false);
              setPaymentCustomerId("");
              setPaymentMethodId("");
              setPaymentDate("");
              setPaymentAmount("");
              setPaymentStatus("paid");
              setPaymentReferenceNumber("");
              setPaymentNotes("");
              setPaymentInvoiceId("");
              setPaymentAllocatedAmount("");
              toast.success("Payment berhasil dibuat");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal membuat payment");
            }
          }}
        >
          <div className="space-y-1">
            <Label>Customer</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={paymentCustomerId} onChange={(e) => setPaymentCustomerId(e.target.value)}>
              <option value="">Pilih Customer</option>
              {(customerListQuery.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.customerNumber} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Payment Method</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
              <option value="">Pilih Payment Method</option>
              {(paymentMethodListQuery.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Payment Date</Label>
            <Input type="datetime-local" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Amount</Label>
            <Input type="number" min={1} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Reference Number</Label>
            <Input value={paymentReferenceNumber} onChange={(e) => setPaymentReferenceNumber(e.target.value)} placeholder="opsional" />
          </div>
          <div className="space-y-1">
            <Label>Invoice Allocation</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={paymentInvoiceId} onChange={(e) => setPaymentInvoiceId(e.target.value)}>
              <option value="">Tanpa alokasi invoice</option>
              {(invoiceForPaymentQuery.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.invoiceNumber} - {item.customerName ?? "-"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Allocated Amount</Label>
            <Input type="number" min={0} value={paymentAllocatedAmount} onChange={(e) => setPaymentAllocatedAmount(e.target.value)} placeholder="opsional, default = amount" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Notes</Label>
            <Input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="opsional" />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" className="rounded-lg border-border bg-background" onClick={() => setPaymentCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg" disabled={paymentCreateMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={paymentEditOpen}
        title="Edit Payment"
        onClose={() => {
          setPaymentEditOpen(false);
          setSelectedPaymentId(null);
        }}
      >
        {paymentDetailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : paymentDetailQuery.isError || !paymentDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Payment tidak ditemukan.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const amount = Number(editPaymentAmount);
              if (Number.isNaN(amount)) {
                toast.error("Amount harus valid");
                return;
              }
              try {
                await paymentUpdateMutation.mutateAsync({
                  id: paymentDetailQuery.data.id,
                  customerId: editPaymentCustomerId,
                  paymentMethodId: editPaymentMethodId || null,
                  paymentDate: editPaymentDate ? new Date(editPaymentDate).toISOString() : undefined,
                  amount,
                  status: editPaymentStatus,
                  referenceNumber: editPaymentReferenceNumber.trim().length ? editPaymentReferenceNumber.trim() : null,
                  notes: editPaymentNotes.trim().length ? editPaymentNotes.trim() : null,
                });
                toast.success("Payment berhasil disimpan");
                setPaymentEditOpen(false);
                setSelectedPaymentId(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan payment");
              }
            }}
          >
            <div className="space-y-1 md:col-span-2">
              <Label>Payment Number</Label>
              <Input value={paymentDetailQuery.data.paymentNumber} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Customer</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={editPaymentCustomerId} onChange={(e) => setEditPaymentCustomerId(e.target.value)}>
                <option value="">Pilih Customer</option>
                {(customerListQuery.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.customerNumber} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={editPaymentMethodId} onChange={(e) => setEditPaymentMethodId(e.target.value)}>
                <option value="">Pilih Payment Method</option>
                {(paymentMethodListQuery.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Payment Date</Label>
              <Input type="datetime-local" value={editPaymentDate} onChange={(e) => setEditPaymentDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input type="number" min={1} value={editPaymentAmount} onChange={(e) => setEditPaymentAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={editPaymentStatus} onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Reference Number</Label>
              <Input value={editPaymentReferenceNumber} onChange={(e) => setEditPaymentReferenceNumber(e.target.value)} placeholder="opsional" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Notes</Label>
              <Input value={editPaymentNotes} onChange={(e) => setEditPaymentNotes(e.target.value)} placeholder="opsional" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 md:col-span-2">
              <Button type="button" variant="destructive" className="rounded-lg" onClick={() => setPaymentDeleteOpen(true)}>
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="rounded-lg border-border bg-background" onClick={() => { setPaymentEditOpen(false); setSelectedPaymentId(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg" disabled={paymentUpdateMutation.isPending}>
                  Save
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={paymentDeleteOpen} title="Delete Payment" onClose={() => setPaymentDeleteOpen(false)}>
        {!paymentDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Payment tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus payment <span className="font-medium">{paymentDetailQuery.data.paymentNumber}</span>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" className="rounded-lg border-border bg-background" onClick={() => setPaymentDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-lg"
                disabled={paymentDeleteMutation.isPending}
                onClick={async () => {
                  if (!paymentDetailQuery.data) return;
                  try {
                    await paymentDeleteMutation.mutateAsync({ id: paymentDetailQuery.data.id });
                    toast.success("Payment dihapus");
                    setPaymentDeleteOpen(false);
                    setPaymentEditOpen(false);
                    setSelectedPaymentId(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal menghapus payment");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
