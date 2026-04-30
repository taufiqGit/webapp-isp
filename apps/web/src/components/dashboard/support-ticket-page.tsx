import { Button } from "@isp-app/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@isp-app/ui/components/card";
import { Input } from "@isp-app/ui/components/input";
import { Label } from "@isp-app/ui/components/label";
import { Skeleton } from "@isp-app/ui/components/skeleton";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { Search, TicketPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import DashboardShell from "./dashboard-shell";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardTopbar from "./dashboard-topbar";
import Modal from "./modal";
import { queryClient, trpc } from "@/utils/trpc";

type TicketChannel = "phone" | "whatsapp" | "portal" | "email" | "walkin";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketStatus =
  | "open"
  | "assigned"
  | "on_progress"
  | "pending_customer"
  | "pending_internal"
  | "resolved"
  | "closed"
  | "cancelled";

function toLocalDateTimeInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function SupportTicketPage({ userName }: { userName?: string }) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState<TicketChannel>("portal");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [visitRequired, setVisitRequired] = useState(false);
  const [visitScheduledAt, setVisitScheduledAt] = useState("");

  const [editCustomerId, setEditCustomerId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editChannel, setEditChannel] = useState<TicketChannel>("portal");
  const [editPriority, setEditPriority] = useState<TicketPriority>("medium");
  const [editStatus, setEditStatus] = useState<TicketStatus>("open");
  const [editVisitRequired, setEditVisitRequired] = useState(false);
  const [editVisitScheduledAt, setEditVisitScheduledAt] = useState("");
  const [editRootCause, setEditRootCause] = useState("");
  const [editResolutionNote, setEditResolutionNote] = useState("");
  const [editCustomerConfirmed, setEditCustomerConfirmed] = useState(false);

  const listInput = useMemo(() => {
    const trimmed = query.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 20,
      offset: 0,
    };
  }, [query]);

  const listQuery = useQuery(trpc.supportTicket.list.queryOptions(listInput));
  const rows = listQuery.data?.items ?? [];
  const detailQuery = useQuery(trpc.supportTicket.byId.queryOptions(selectedTicketId ? { id: selectedTicketId } : skipToken));

  const customerListQuery = useQuery(
    trpc.customer.list.queryOptions({
      limit: 100,
      offset: 0,
    }),
  );

  const categoryListQuery = useQuery(
    trpc.supportTicketCategory.list.queryOptions({
      limit: 100,
      offset: 0,
      isActive: true,
    }),
  );

  useEffect(() => {
    const row = detailQuery.data;
    if (!row || !editOpen) return;
    setEditCustomerId(row.customerId ?? "");
    setEditCategoryId(row.categoryId ?? "");
    setEditSubject(row.subject);
    setEditDescription(row.description);
    setEditChannel(row.channel);
    setEditPriority(row.priority);
    setEditStatus(row.status);
    setEditVisitRequired(row.visitRequired);
    setEditVisitScheduledAt(toLocalDateTimeInput(row.visitScheduledAt));
    setEditRootCause(row.rootCause ?? "");
    setEditResolutionNote(row.resolutionNote ?? "");
    setEditCustomerConfirmed(row.customerConfirmed);
  }, [detailQuery.data, editOpen]);

  const createMutation = useMutation(
    trpc.supportTicket.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.supportTicket.list.queryKey(listInput),
        });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.supportTicket.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.supportTicket.list.queryKey(listInput),
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.supportTicket.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.supportTicket.list.queryKey(listInput),
        });
      },
    }),
  );

  return (
    <DashboardShell
      sidebar={<DashboardSidebar />}
      topbar={<DashboardTopbar userName={userName} title="Support Tickets" subtitle="Kelola transaksi ticket support pelanggan" />}
    >
      <Card className="bg-background">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Support Ticket List</span>
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
                placeholder="Cari nomor ticket / subjek / customer"
              />
            </div>
            {listQuery.isError ? (
              <p className="text-xs text-destructive">{listQuery.error.message}</p>
            ) : (
              <Button size="sm" className="rounded-lg" onClick={() => setCreateOpen(true)}>
                <TicketPlus className="mr-2 size-4" />
                Add Ticket
              </Button>
            )}
          </div>

          <div className="mt-3 min-h-0 overflow-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 font-medium">Ticket No</th>
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Category</th>
                  <th className="py-2 font-medium">Subject</th>
                  <th className="py-2 font-medium">Channel</th>
                  <th className="py-2 font-medium">Priority</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading
                  ? new Array(8).fill(null).map((_, index) => (
                      <tr key={`support-ticket-skeleton-${index}`} className="border-b last:border-0">
                        <td className="py-3">
                          <Skeleton className="h-3 w-28" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-24" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-20" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-36" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-16" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-16" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="h-3 w-16" />
                        </td>
                      </tr>
                    ))
                  : rows.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/20"
                        onClick={() => {
                          setSelectedTicketId(row.id);
                          setEditOpen(true);
                        }}
                      >
                        <td className="py-3 font-medium">{row.ticketNumber}</td>
                        <td className="py-3">{row.customerName ?? "-"}</td>
                        <td className="py-3">{row.categoryName ?? "-"}</td>
                        <td className="py-3">{row.subject}</td>
                        <td className="py-3">{row.channel}</td>
                        <td className="py-3">{row.priority}</td>
                        <td className="py-3">{row.status}</td>
                      </tr>
                    ))}
                {!listQuery.isLoading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Belum ada ticket. Klik Add Ticket untuk membuat ticket pertama.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal open={createOpen} title="Create Support Ticket" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!subject.trim().length || !description.trim().length) {
              toast.error("Subject dan Description wajib diisi");
              return;
            }
            try {
              await createMutation.mutateAsync({
                customerId: customerId || undefined,
                categoryId: categoryId || undefined,
                subject: subject.trim(),
                description: description.trim(),
                channel,
                priority,
                visitRequired,
                visitScheduledAt: visitScheduledAt ? new Date(visitScheduledAt).toISOString() : undefined,
              });
              setCreateOpen(false);
              setCustomerId("");
              setCategoryId("");
              setSubject("");
              setDescription("");
              setChannel("portal");
              setPriority("medium");
              setVisitRequired(false);
              setVisitScheduledAt("");
              toast.success("Support ticket berhasil dibuat");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal membuat support ticket");
            }
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-customer">Customer</Label>
            <select
              id="create-support-ticket-customer"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">Pilih Customer</option>
              {(customerListQuery.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.customerNumber} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-category">Category</Label>
            <select
              id="create-support-ticket-category"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Pilih Category</option>
              {(categoryListQuery.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="create-support-ticket-subject">Subject</Label>
            <Input
              id="create-support-ticket-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Contoh: Internet down sejak pagi"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="create-support-ticket-description">Description</Label>
            <Input
              id="create-support-ticket-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Jelaskan detail keluhan"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-channel">Channel</Label>
            <select
              id="create-support-ticket-channel"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={channel}
              onChange={(event) => setChannel(event.target.value as TicketChannel)}
            >
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="portal">Portal</option>
              <option value="email">Email</option>
              <option value="walkin">Walk-in</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-priority">Priority</Label>
            <select
              id="create-support-ticket-priority"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TicketPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-visit-required">Visit Required</Label>
            <select
              id="create-support-ticket-visit-required"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={visitRequired ? "yes" : "no"}
              onChange={(event) => setVisitRequired(event.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-visit-at">Visit Schedule</Label>
            <Input
              id="create-support-ticket-visit-at"
              type="datetime-local"
              value={visitScheduledAt}
              onChange={(event) => setVisitScheduledAt(event.target.value)}
            />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-border bg-background"
              onClick={() => setCreateOpen(false)}
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
        title="Edit Support Ticket"
        onClose={() => {
          setEditOpen(false);
          setSelectedTicketId(null);
        }}
      >
        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : detailQuery.isError || !detailQuery.data ? (
          <p className="text-sm text-muted-foreground">Support ticket tidak ditemukan.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await updateMutation.mutateAsync({
                  id: detailQuery.data.id,
                  customerId: editCustomerId || null,
                  categoryId: editCategoryId || null,
                  subject: editSubject.trim(),
                  description: editDescription.trim(),
                  channel: editChannel,
                  priority: editPriority,
                  status: editStatus,
                  visitRequired: editVisitRequired,
                  visitScheduledAt: editVisitScheduledAt ? new Date(editVisitScheduledAt).toISOString() : null,
                  rootCause: editRootCause.trim().length ? editRootCause.trim() : null,
                  resolutionNote: editResolutionNote.trim().length ? editResolutionNote.trim() : null,
                  customerConfirmed: editCustomerConfirmed,
                });
                toast.success("Support ticket berhasil disimpan");
                setEditOpen(false);
                setSelectedTicketId(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan support ticket");
              }
            }}
          >
            <div className="space-y-1 md:col-span-2">
              <Label>Ticket Number</Label>
              <Input value={detailQuery.data.ticketNumber} readOnly />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-customer">Customer</Label>
              <select
                id="edit-support-ticket-customer"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editCustomerId}
                onChange={(event) => setEditCustomerId(event.target.value)}
              >
                <option value="">Pilih Customer</option>
                {(customerListQuery.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.customerNumber} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-category">Category</Label>
              <select
                id="edit-support-ticket-category"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editCategoryId}
                onChange={(event) => setEditCategoryId(event.target.value)}
              >
                <option value="">Pilih Category</option>
                {(categoryListQuery.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-support-ticket-subject">Subject</Label>
              <Input
                id="edit-support-ticket-subject"
                value={editSubject}
                onChange={(event) => setEditSubject(event.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-support-ticket-description">Description</Label>
              <Input
                id="edit-support-ticket-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-channel">Channel</Label>
              <select
                id="edit-support-ticket-channel"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editChannel}
                onChange={(event) => setEditChannel(event.target.value as TicketChannel)}
              >
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="portal">Portal</option>
                <option value="email">Email</option>
                <option value="walkin">Walk-in</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-priority">Priority</Label>
              <select
                id="edit-support-ticket-priority"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editPriority}
                onChange={(event) => setEditPriority(event.target.value as TicketPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-status">Status</Label>
              <select
                id="edit-support-ticket-status"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editStatus}
                onChange={(event) => setEditStatus(event.target.value as TicketStatus)}
              >
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="on_progress">On Progress</option>
                <option value="pending_customer">Pending Customer</option>
                <option value="pending_internal">Pending Internal</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-visit-required">Visit Required</Label>
              <select
                id="edit-support-ticket-visit-required"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editVisitRequired ? "yes" : "no"}
                onChange={(event) => setEditVisitRequired(event.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-visit-at">Visit Schedule</Label>
              <Input
                id="edit-support-ticket-visit-at"
                type="datetime-local"
                value={editVisitScheduledAt}
                onChange={(event) => setEditVisitScheduledAt(event.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-support-ticket-root-cause">Root Cause</Label>
              <Input
                id="edit-support-ticket-root-cause"
                value={editRootCause}
                onChange={(event) => setEditRootCause(event.target.value)}
                placeholder="opsional"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-support-ticket-resolution-note">Resolution Note</Label>
              <Input
                id="edit-support-ticket-resolution-note"
                value={editResolutionNote}
                onChange={(event) => setEditResolutionNote(event.target.value)}
                placeholder="opsional"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-support-ticket-customer-confirmed">Customer Confirmed</Label>
              <select
                id="edit-support-ticket-customer-confirmed"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editCustomerConfirmed ? "yes" : "no"}
                onChange={(event) => setEditCustomerConfirmed(event.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
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
                    setSelectedTicketId(null);
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

      <Modal open={deleteOpen} title="Delete Support Ticket" onClose={() => setDeleteOpen(false)}>
        {!detailQuery.data ? (
          <p className="text-sm text-muted-foreground">Support ticket tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus ticket <span className="font-medium">{detailQuery.data.ticketNumber}</span> -{" "}
              <span className="font-medium">{detailQuery.data.subject}</span>?
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
                  if (!detailQuery.data) return;
                  try {
                    await deleteMutation.mutateAsync({ id: detailQuery.data.id });
                    toast.success("Support ticket dihapus");
                    setDeleteOpen(false);
                    setEditOpen(false);
                    setSelectedTicketId(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal menghapus support ticket");
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
