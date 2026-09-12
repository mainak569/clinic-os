"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { listProviders, setProviderActive } from "@/app/actions/provider.actions";
import { ProviderFormDialog } from "./provider-form-dialog";

function fullName(p: any) {
  return [p.title, p.firstName, p.lastName].filter(Boolean).join(" ");
}

export function ProvidersTable() {
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirming, setConfirming] = useState<any | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await listProviders({ includeInactive: showInactive });
    if (result.success) {
      setProviders(result.data);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }, [showInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) =>
      [fullName(p), p.user?.email, p.profile?.specialization]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    );
  }, [providers, search]);

  const handleToggle = async () => {
    if (!confirming) return;
    setIsToggling(true);
    const next = !confirming.isActive;
    const result = await setProviderActive({ id: confirming.id, isActive: next });
    setIsToggling(false);

    if (result.success) {
      toast.success(next ? "Provider reactivated" : "Provider deactivated");
      setConfirming(null);
      load();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowInactive((v) => !v)}
            aria-pressed={showInactive}
          >
            {showInactive ? "Hide inactive" : "Show inactive"}
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Provider
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Sign-in</TableHead>
              <TableHead>Scheduling</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Stethoscope className="h-8 w-8" />
                    <p>{search ? "No providers match that search" : "No providers yet"}</p>
                    {!search && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setEditing(null);
                          setFormOpen(true);
                        }}
                      >
                        Add the first provider
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((provider) => (
                <TableRow key={provider.id} className={provider.isActive ? "" : "opacity-60"}>
                  <TableCell>
                    <div className="font-medium">{fullName(provider)}</div>
                    <div className="text-sm text-muted-foreground">
                      {provider.profile?.specialization || "No specialization set"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{provider.user?.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {provider.user?.lastLogin
                        ? `Last sign-in ${new Date(provider.user.lastLogin).toLocaleDateString()}`
                        : "Never signed in"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {provider.profile
                      ? `${provider.profile.appointmentLength} min visits, ${provider.profile.bufferTime} min buffer`
                      : "Defaults"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {provider._count.appointments} appointments
                    <br />
                    {provider._count.availabilitySlots} availability slots
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        provider.isActive
                          ? "bg-green-100/80 text-green-700 border-green-200"
                          : "bg-slate-100/80 text-slate-600 border-slate-200"
                      }
                    >
                      {provider.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" aria-label={`Actions for ${fullName(provider)}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(provider);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setConfirming(provider)}
                          className={provider.isActive ? "text-destructive" : ""}
                        >
                          {provider.isActive ? (
                            <PowerOff className="mr-2 h-4 w-4" />
                          ) : (
                            <Power className="mr-2 h-4 w-4" />
                          )}
                          {provider.isActive ? "Deactivate" : "Reactivate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProviderFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        provider={editing}
        onSuccess={load}
      />

      <AlertDialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming?.isActive ? "Deactivate" : "Reactivate"} {confirming && fullName(confirming)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.isActive
                ? "They won't be able to sign in or be booked for new appointments. Their past appointments, notes and availability are kept. This is refused while they still have open appointments."
                : "They'll be able to sign in again and can be booked for appointments."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleToggle();
              }}
              disabled={isToggling}
            >
              {isToggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirming?.isActive ? "Deactivate" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
