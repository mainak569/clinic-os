"use client";

import { useState } from "react";
import { Calendar, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  exportScheduleToCSV,
  exportScheduleToJSON,
  getDailySchedule,
} from "@/app/actions/bulk-availability.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

/**
 * Schedule Export Component
 * 
 * Allows exporting provider schedule to CSV or JSON
 * Shows preview of schedule data
 */

interface ScheduleExportProps {
  providerId: string;
  providerName: string;
}

export function ScheduleExport({ providerId, providerName }: ScheduleExportProps) {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(
    format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportScheduleToCSV({
        providerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        format: "csv",
      });

      if (result.success) {
        // Download CSV
        const blob = new Blob([result.data.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.success("Schedule exported to CSV");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to export schedule");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const result = await exportScheduleToJSON({
        providerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        format: "json",
      });

      if (result.success) {
        // Download JSON
        const blob = new Blob([result.data.json], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.success("Schedule exported to JSON");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to export schedule");
    } finally {
      setIsExporting(false);
    }
  };

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const result = await getDailySchedule({
        providerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      if (result.success) {
        setSchedule(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load schedule preview");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Schedule</CardTitle>
          <CardDescription>
            Export {providerName}&apos;s availability schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleExportCSV}
              disabled={isExporting}
              variant="default"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>

            <Button
              onClick={handleExportJSON}
              disabled={isExporting}
              variant="outline"
            >
              <FileJson className="mr-2 h-4 w-4" />
              Export to JSON
            </Button>

            <Button
              onClick={loadPreview}
              disabled={isLoadingPreview}
              variant="secondary"
            >
              <Download className="mr-2 h-4 w-4" />
              {isLoadingPreview ? "Loading..." : "Preview"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Preview */}
      {schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Preview</CardTitle>
            <CardDescription>
              Showing {schedule.length} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time Slots</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {format(new Date(day.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{day.dayOfWeek}</Badge>
                      </TableCell>
                      <TableCell>
                        {day.slots.length === 0 ? (
                          <span className="text-muted-foreground text-sm">
                            No availability
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {day.slots.map((slot: any, slotIndex: number) => (
                              <div
                                key={slotIndex}
                                className="text-sm"
                              >
                                {format(new Date(slot.startTime), "h:mm a")} -{" "}
                                {format(new Date(slot.endTime), "h:mm a")}
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {day.slots.length > 0 ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">None</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
