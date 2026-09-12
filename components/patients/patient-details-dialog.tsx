"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  FileText,
  Edit,
  Loader2,
  Heart,
  Shield,
  History,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statusBadge, statusLabel } from "@/lib/appointment-status";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getPatientById } from "@/app/actions/patient.actions";

interface PatientDetailsDialogProps {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onEdit: (patient: any) => void;
}

export function PatientDetailsDialog({
  patientId,
  open,
  onOpenChange,
  canEdit,
  onEdit,
}: PatientDetailsDialogProps) {
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && patientId) {
      loadPatient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientId]);

  const loadPatient = async () => {
    setIsLoading(true);
    try {
      const result = await getPatientById({ id: patientId });
      if (result.success) {
        setPatient(result.data);
      }
    } catch (error) {
      console.error("Error loading patient:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: Date | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!patient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient Not Found</DialogTitle>
            <DialogDescription>
              The requested patient could not be loaded.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const age = calculateAge(patient.dateOfBirth);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {patient.firstName} {patient.lastName}
              </DialogTitle>
              <DialogDescription>
                {age !== null && `Age ${age} • `}
                {patient.dateOfBirth &&
                  `DOB: ${format(new Date(patient.dateOfBirth), "MMMM d, yyyy")}`}
              </DialogDescription>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(patient)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="demographics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="appointments">
              Appointments ({patient.appointments?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Full Name</div>
                    <div className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date of Birth</div>
                    <div className="font-medium">
                      {patient.dateOfBirth
                        ? format(new Date(patient.dateOfBirth), "MMMM d, yyyy")
                        : "—"}
                    </div>
                  </div>
                </div>
                {age !== null && (
                  <div>
                    <div className="text-sm text-muted-foreground">Age</div>
                    <div className="font-medium">{age} years old</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.allergies && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <div className="text-sm font-medium text-red-500">Allergies</div>
                    </div>
                    <div className="text-sm bg-red-50 border border-red-200 rounded p-2">
                      {patient.allergies}
                    </div>
                  </div>
                )}

                {patient.medications && (
                  <div>
                    <div className="text-sm font-medium mb-1">Current Medications</div>
                    <div className="text-sm whitespace-pre-wrap">{patient.medications}</div>
                  </div>
                )}

                {patient.medicalHistory && (
                  <div>
                    <div className="text-sm font-medium mb-1">Medical History</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {patient.medicalHistory}
                    </div>
                  </div>
                )}

                {!patient.allergies && !patient.medications && !patient.medicalHistory && (
                  <div className="text-sm text-muted-foreground">
                    No medical information recorded
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {!patient.email && !patient.phone && (
                  <div className="text-sm text-muted-foreground">
                    No contact information
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.address || patient.city || patient.state || patient.zipCode ? (
                  <div className="text-sm">
                    {patient.address && <div>{patient.address}</div>}
                    <div>
                      {patient.city}
                      {patient.city && patient.state && ", "}
                      {patient.state} {patient.zipCode}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No address on file</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.emergencyContactName || patient.emergencyContactPhone ? (
                  <div className="space-y-2">
                    {patient.emergencyContactName && (
                      <div>
                        <div className="text-sm text-muted-foreground">Name</div>
                        <div className="font-medium">{patient.emergencyContactName}</div>
                      </div>
                    )}
                    {patient.emergencyContactPhone && (
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{patient.emergencyContactPhone}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No emergency contact on file
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.insuranceProvider || patient.insuranceId ? (
                  <div className="space-y-3">
                    {patient.insuranceProvider && (
                      <div>
                        <div className="text-sm text-muted-foreground">Provider</div>
                        <div className="font-medium">{patient.insuranceProvider}</div>
                      </div>
                    )}
                    {patient.insuranceId && (
                      <div>
                        <div className="text-sm text-muted-foreground">Insurance ID</div>
                        <div className="font-medium font-mono">{patient.insuranceId}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No insurance information on file
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            {patient.appointments && patient.appointments.length > 0 ? (
              <div className="space-y-3">
                {patient.appointments.map((appointment: any) => (
                  <Card key={appointment.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="font-medium">
                              {format(new Date(appointment.scheduledAt), "MMMM d, yyyy")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(appointment.scheduledAt), "h:mm a")}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {appointment.provider.title} {appointment.provider.firstName}{" "}
                              {appointment.provider.lastName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.type.replace(/_/g, " ")}</span>
                          </div>

                          {appointment.reason && (
                            <div className="text-sm text-muted-foreground mt-2">
                              <span className="font-medium">Reason: </span>
                              {appointment.reason}
                            </div>
                          )}
                        </div>

                        <Badge
                          variant="outline"
                          className={statusBadge(appointment.status)}
                        >
                          {statusLabel(appointment.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No appointments on record</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
