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

type TicketPriority = "low" | "medium" | "high" | "critical";

export default function MasterSupportTicketCategoryPage() {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [defaultPriority, setDefaultPriority] = useState<TicketPriority>("medium");
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");

  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDefaultPriority, setEditDefaultPriority] = useState<TicketPriority>("medium");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editDescription, setEditDescription] = useState("");

  const listInput = useMemo(() => {
    const trimmed = query.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 20,
      offset: 0,
    };
  }, [query]);

  const listQuery = useQuery(trpc.supportTicketCategory.list.queryOptions(listInput));
  const rows = listQuery.data?.items ?? [];

  const detailQuery = useQuery(
    trpc.supportTicketCategory.byId.queryOptions(selectedCategoryId ? { id: selectedCategoryId } : skipToken),
  );

  useEffect(() => {
    const row = detailQuery.data;
    if (!row || !editOpen) return;
    setEditCode(row.code);
    setEditName(row.name);
    setEditDefaultPriority(row.defaultPriority);
    setEditIsActive(row.isActive);
    setEditDescription(row.description ?? "");
  }, [detailQuery.data, editOpen]);

  const createMutation = useMutation(
    trpc.supportTicketCategory.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.supportTicketCategory.list.queryKey(listInput),
        });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.supportTicketCategory.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.supportTicketCategory.list.queryKey(listInput),
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.supportTicketCategory.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.supportTicketCategory.list.queryKey(listInput),
        });
      },
    }),
  );

  return (
    <Card className="bg-background">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Support Ticket Category</span>
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
              placeholder="Cari kode / nama / deskripsi"
            />
          </div>
          {listQuery.isError ? (
            <p className="text-xs text-destructive">{listQuery.error.message}</p>
          ) : (
            <Button size="sm" className="rounded-lg" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Category
            </Button>
          )}
        </div>

        <div className="mt-3 min-h-0 overflow-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 font-medium">Code</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Default Priority</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading
                ? new Array(8).fill(null).map((_, index) => (
                    <tr key={`support-ticket-category-skeleton-${index}`} className="border-b last:border-0">
                      <td className="py-3">
                        <Skeleton className="h-3 w-16" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-32" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-16" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-14" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-44" />
                      </td>
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/20"
                      onClick={() => {
                        setSelectedCategoryId(row.id);
                        setEditOpen(true);
                      }}
                    >
                      <td className="py-3 font-medium">{row.code}</td>
                      <td className="py-3">{row.name}</td>
                      <td className="py-3">{row.defaultPriority}</td>
                      <td className="py-3">{row.isActive ? "Active" : "Inactive"}</td>
                      <td className="py-3 text-muted-foreground">{row.description ?? "-"}</td>
                    </tr>
                  ))}
              {!listQuery.isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada category. Klik Add Category untuk membuat data pertama.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Modal open={createOpen} title="Create Support Ticket Category" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!code.trim().length || !name.trim().length) {
              toast.error("Code dan Name wajib diisi");
              return;
            }

            try {
              await createMutation.mutateAsync({
                code: code.trim(),
                name: name.trim(),
                defaultPriority,
                isActive,
                description: description.trim().length ? description.trim() : undefined,
              });

              setCreateOpen(false);
              setCode("");
              setName("");
              setDefaultPriority("medium");
              setIsActive(true);
              setDescription("");
              toast.success("Category berhasil dibuat");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal membuat category");
            }
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-category-code">Code</Label>
            <Input
              id="create-support-ticket-category-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="NO_INET"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-category-name">Name</Label>
            <Input
              id="create-support-ticket-category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="No Internet"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-category-priority">Default Priority</Label>
            <select
              id="create-support-ticket-category-priority"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={defaultPriority}
              onChange={(event) => setDefaultPriority(event.target.value as TicketPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-support-ticket-category-status">Status</Label>
            <select
              id="create-support-ticket-category-status"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={isActive ? "active" : "inactive"}
              onChange={(event) => setIsActive(event.target.value === "active")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="create-support-ticket-category-description">Description</Label>
            <Input
              id="create-support-ticket-category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="opsional"
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
        title="Edit Support Ticket Category"
        onClose={() => {
          setEditOpen(false);
          setSelectedCategoryId(null);
        }}
      >
        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : detailQuery.isError || !detailQuery.data ? (
          <p className="text-sm text-muted-foreground">Category tidak ditemukan.</p>
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
                  defaultPriority: editDefaultPriority,
                  isActive: editIsActive,
                  description: editDescription.trim().length ? editDescription.trim() : null,
                });
                toast.success("Category berhasil disimpan");
                setEditOpen(false);
                setSelectedCategoryId(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan category");
              }
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-category-code">Code</Label>
              <Input
                id="edit-support-ticket-category-code"
                value={editCode}
                onChange={(event) => setEditCode(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-category-name">Name</Label>
              <Input
                id="edit-support-ticket-category-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-category-priority">Default Priority</Label>
              <select
                id="edit-support-ticket-category-priority"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editDefaultPriority}
                onChange={(event) => setEditDefaultPriority(event.target.value as TicketPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-support-ticket-category-status">Status</Label>
              <select
                id="edit-support-ticket-category-status"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editIsActive ? "active" : "inactive"}
                onChange={(event) => setEditIsActive(event.target.value === "active")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-support-ticket-category-description">Description</Label>
              <Input
                id="edit-support-ticket-category-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder="opsional"
              />
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
                    setSelectedCategoryId(null);
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

      <Modal open={deleteOpen} title="Delete Support Ticket Category" onClose={() => setDeleteOpen(false)}>
        {!detailQuery.data ? (
          <p className="text-sm text-muted-foreground">Category tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus category <span className="font-medium">{detailQuery.data.code}</span> -{" "}
              <span className="font-medium">{detailQuery.data.name}</span>?
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
                    toast.success("Category dihapus");
                    setDeleteOpen(false);
                    setEditOpen(false);
                    setSelectedCategoryId(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal menghapus category");
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
