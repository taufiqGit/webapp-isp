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

function formatRate(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return `${parsed.toFixed(2)}%`;
}

export default function MasterTaxPage() {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTaxId, setSelectedTaxId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");

  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const listInput = useMemo(() => {
    const trimmed = query.trim();
    return {
      query: trimmed.length ? trimmed : undefined,
      limit: 20,
      offset: 0,
    };
  }, [query]);

  const listQuery = useQuery(trpc.tax.list.queryOptions(listInput));
  const rows = listQuery.data?.items ?? [];

  const taxDetailQuery = useQuery(trpc.tax.byId.queryOptions(selectedTaxId ? { id: selectedTaxId } : skipToken));

  useEffect(() => {
    const tax = taxDetailQuery.data;
    if (!tax || !editOpen) return;

    setEditCode(tax.code);
    setEditName(tax.name);
    setEditRate(Number(tax.rate).toFixed(2));
    setEditDescription(tax.description ?? "");
  }, [taxDetailQuery.data, editOpen]);

  const createMutation = useMutation(
    trpc.tax.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.tax.list.queryKey(listInput),
        });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.tax.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.tax.list.queryKey(listInput),
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.tax.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.tax.list.queryKey(listInput),
        });
      },
    }),
  );

  return (
    <Card className="bg-background">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Tax List</span>
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
            <Button
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Add Tax
            </Button>
          )}
        </div>

        <div className="mt-3 min-h-0 overflow-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 font-medium">Code</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium text-right">Rate</th>
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 font-medium">Updated At</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading
                ? new Array(8).fill(null).map((_, index) => (
                    <tr key={`tax-skeleton-${index}`} className="border-b last:border-0">
                      <td className="py-3">
                        <Skeleton className="h-3 w-16" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-32" />
                      </td>
                      <td className="py-3 text-right">
                        <Skeleton className="ml-auto h-3 w-12" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-3 w-44" />
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
                        setSelectedTaxId(row.id);
                        setEditOpen(true);
                      }}
                    >
                      <td className="py-3 font-medium">{row.code}</td>
                      <td className="py-3">{row.name}</td>
                      <td className="py-3 text-right font-medium">{formatRate(row.rate)}</td>
                      <td className="py-3 text-muted-foreground">{row.description ?? "-"}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(row.updatedAt).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
              {!listQuery.isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada data tax. Klik Add Tax untuk membuat data pertama.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Modal
        open={createOpen}
        title="Create Tax"
        onClose={() => {
          setCreateOpen(false);
        }}
      >
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmedCode = code.trim();
            const trimmedName = name.trim();
            const parsedRate = Number(rate);

            if (!trimmedCode.length || !trimmedName.length || Number.isNaN(parsedRate)) {
              toast.error("Code, Name, dan Rate wajib valid");
              return;
            }

            try {
              await createMutation.mutateAsync({
                code: trimmedCode,
                name: trimmedName,
                rate: parsedRate,
                description: description.trim().length ? description.trim() : undefined,
              });

              setCreateOpen(false);
              setCode("");
              setName("");
              setRate("");
              setDescription("");
              toast.success("Tax berhasil dibuat");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal membuat tax");
            }
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="create-tax-code">Code</Label>
            <Input
              id="create-tax-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Contoh: PPN11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-tax-name">Name</Label>
            <Input
              id="create-tax-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: PPN 11%"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-tax-rate">Rate (%)</Label>
            <Input
              id="create-tax-rate"
              type="number"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              min={0}
              max={100}
              step="0.01"
              placeholder="11.00"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-tax-description">Description</Label>
            <Input
              id="create-tax-description"
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
        title="Edit Tax"
        onClose={() => {
          setEditOpen(false);
          setSelectedTaxId(null);
        }}
      >
        {taxDetailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : taxDetailQuery.isError || !taxDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Tax tidak ditemukan.</p>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const parsedRate = Number(editRate);
              if (Number.isNaN(parsedRate)) {
                toast.error("Rate harus berupa angka");
                return;
              }

              try {
                await updateMutation.mutateAsync({
                  id: taxDetailQuery.data.id,
                  code: editCode.trim(),
                  name: editName.trim(),
                  rate: parsedRate,
                  description: editDescription.trim().length ? editDescription.trim() : null,
                });
                toast.success("Tax berhasil disimpan");
                setEditOpen(false);
                setSelectedTaxId(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan tax");
              }
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="edit-tax-code">Code</Label>
              <Input id="edit-tax-code" value={editCode} onChange={(event) => setEditCode(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-tax-name">Name</Label>
              <Input id="edit-tax-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-tax-rate">Rate (%)</Label>
              <Input
                id="edit-tax-rate"
                type="number"
                value={editRate}
                onChange={(event) => setEditRate(event.target.value)}
                min={0}
                max={100}
                step="0.01"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-tax-description">Description</Label>
              <Input
                id="edit-tax-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder="opsional"
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 md:col-span-2">
              <Button
                type="button"
                variant="destructive"
                className="rounded-lg"
                onClick={() => {
                  setDeleteOpen(true);
                }}
              >
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-border bg-background"
                  onClick={() => {
                    setEditOpen(false);
                    setSelectedTaxId(null);
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

      <Modal
        open={deleteOpen}
        title="Delete Tax"
        onClose={() => {
          setDeleteOpen(false);
        }}
      >
        {!taxDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Tax tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Hapus tax <span className="font-medium">{taxDetailQuery.data.code}</span> -{" "}
              <span className="font-medium">{taxDetailQuery.data.name}</span>?
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
                  if (!taxDetailQuery.data) return;
                  try {
                    await deleteMutation.mutateAsync({ id: taxDetailQuery.data.id });
                    toast.success("Tax dihapus");
                    setDeleteOpen(false);
                    setEditOpen(false);
                    setSelectedTaxId(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Gagal menghapus tax");
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
