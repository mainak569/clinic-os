"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Search,
  Plus,
  Calendar,
  Clock,
  User,
  MoreHorizontal,
  Eye,
  Check,
  UserCheck,
  CheckCircle,
  XCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { statusBadge, statusLabel, STATUS_ORDER, APPOINTMENT_STATUS } from "@/lib/appointment-status";
import { getAppointments, getProviders } from "@/app/actions/queries.actions";
import {
  confirmAppointment,
  checkInAppointment,
  completeAppointment,
} from "@/app/actions/appointment.actions";
import type { AppointmentStatus } from "@prisma/client";
import { CreateAppointmentDialog } from "./create-appointment-dialog";
import { AppointmentDetailsDialog } from "./appointment-details-dialog";
import { CancelAppointmentDialog } from "./cancel-appointment-dialog";
import { NoShowDialog } from "./no-show-dialog";

interface AppointmentsTableProps {
  userRole: string;
  providerId?: string;
}

export function AppointmentsTable({ userRole, providerId }: AppointmentsTableProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const result = await getAppointments({
        page,
        pageSize,
        search: search || undefined,
        providerId: userRole === "PROVIDER" ? providerId : (providerFilter !== "all" ? providerFilter : undefined),
        status: statusFilter !== "all" ? (statusFilter as AppointmentStatus) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      if (result.success) {
        setAppointments(result.data.appointments);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error(result.error || "Failed to load appointments");
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProviders = async () => {
    if (userRole === "FRONT_DESK") {
      const result = await getProviders();
      if (result.success) {
        setProviders(result.data);
      }
    }
  };

  useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, providerFilter, startDate, endDate]);

  const handleConfirm = async (appointmentId: string) => {
    const result = await confirmAppointment({ appointmentId });
    if (result.success) {
      toast.success("Appointment confirmed");
      loadAppointments();
    } else {
      toast.error(result.error || "Failed to confirm appointment");
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    const result = await checkInAppointment({ appointmentId });
    if (result.success) {
      toast.success("Patient checked in");
      loadAppointments();
    } else {
      toast.error(result.error || "Failed to check in patient");
    }
  };

  const handleComplete = async (appointmentId: string) => {
    const result = await completeAppointment({ appointmentId });
    if (result.success) {
      toast.success("Appointment completed");
      loadAppointments();
    } else {
      toast.error(result.error || "Failed to complete appointment");
    }
  };

  const canConfirm = (status: string) => status === "REQUESTED";
  const canCheckIn = (status: string) => status === "CONFIRMED";
  const canComplete = (status: string) => status === "CHECKED_IN";
  const canMarkNoShow = (status: string, scheduledAt: Date) => {
    return status === "CONFIRMED" && new Date() > new Date(scheduledAt);
  };
  const canCancel = (status: string) => {
    return ["REQUESTED", "CONFIRMED"].includes(status);
  };

  if (isLoading && appointments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_ORDER.map((key) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: APPOINTMENT_STATUS[key].hex }}
                  />
                  {APPOINTMENT_STATUS[key].label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Provider Filter - Only for FRONT_DESK */}
        {userRole === "FRONT_DESK" && (
          <Select
            value={providerFilter}
            onValueChange={(value) => {
              setProviderFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.title} {provider.firstName} {provider.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Create Appointment Button */}
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Date Range Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From:</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-[150px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To:</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-[150px]"
          />
        </div>
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
          >
            Clear Dates
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2" />
                    <p>No appointments found</p>
                    <p className="text-sm">Try adjusting your filters or create a new appointment</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </div>
                      {appointment.patient.email && (
                        <div className="text-sm text-muted-foreground">
                          {appointment.patient.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {appointment.provider.title} {appointment.provider.firstName} {appointment.provider.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div>{format(new Date(appointment.scheduledAt), "MMM d, yyyy")}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(appointment.scheduledAt), "h:mm a")} ({appointment.duration} min)
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {appointment.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusBadge(appointment.status)}
                    >
                      {statusLabel(appointment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAppointmentId(appointment.id);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        
                        {canConfirm(appointment.status) && (
                          <DropdownMenuItem onClick={() => handleConfirm(appointment.id)}>
                            <Check className="mr-2 h-4 w-4" />
                            Confirm
                          </DropdownMenuItem>
                        )}
                        
                        {canCheckIn(appointment.status) && (
                          <DropdownMenuItem onClick={() => handleCheckIn(appointment.id)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Check In
                          </DropdownMenuItem>
                        )}
                        
                        {canComplete(appointment.status) && (
                          <DropdownMenuItem onClick={() => handleComplete(appointment.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Complete
                          </DropdownMenuItem>
                        )}
                        
                        {canMarkNoShow(appointment.status, appointment.scheduledAt) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAppointmentId(appointment.id);
                              setNoShowDialogOpen(true);
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark No-Show
                          </DropdownMenuItem>
                        )}
                        
                        {canCancel(appointment.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAppointmentId(appointment.id);
                                setCancelDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} appointments
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateAppointmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          loadAppointments();
        }}
        userRole={userRole}
        providerId={providerId}
      />

      {selectedAppointmentId && (
        <>
          <AppointmentDetailsDialog
            appointmentId={selectedAppointmentId}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />

          <CancelAppointmentDialog
            appointmentId={selectedAppointmentId}
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            onSuccess={() => {
              setCancelDialogOpen(false);
              loadAppointments();
            }}
          />

          <NoShowDialog
            appointmentId={selectedAppointmentId}
            open={noShowDialogOpen}
            onOpenChange={setNoShowDialogOpen}
            onSuccess={() => {
              setNoShowDialogOpen(false);
              loadAppointments();
            }}
          />
        </>
      )}
    </div>
  );
}
