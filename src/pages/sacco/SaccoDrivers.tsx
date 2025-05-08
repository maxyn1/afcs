import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import saccoAdminService from "@/services/saccoAdminService";
import type { Driver } from "@/services/driverService";
import { RegisterDriverModal } from "@/components/drivers/RegisterDriverModal";
import { AssignVehicleToDriverModal } from "@/components/drivers/AssignVehicleToDriverModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "@/components/ui/use-toast";
import { Search, Calendar } from "lucide-react";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const SaccoDrivers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isNewDriverOpen, setIsNewDriverOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<{id: number, name: string} | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["saccoDrivers", page, limit],
    queryFn: () => saccoAdminService.getDrivers(),
  });

  const createDriverMutation = useMutation({
    mutationFn: (driverData: Partial<Driver>) => saccoAdminService.createDriver(driverData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saccoDrivers"] });
      toast({
        title: "Driver created",
        description: "The driver has been registered successfully.",
      });
      setIsNewDriverOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description:
          error.message || "Failed to register driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) =>
      saccoAdminService.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saccoDrivers"] });
      toast({
        title: "Driver updated",
        description: "The driver has been updated successfully.",
      });
      setEditingDriver(null);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description:
          error.message || "Failed to update driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (id: string) => saccoAdminService.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saccoDrivers"] });
      toast({
        title: "Driver deleted",
        description: "The driver has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description:
          error.message || "Failed to delete driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  const assignVehicleMutation = useMutation({
    mutationFn: ({ driverId, vehicleId }: { driverId: number; vehicleId: number }) =>
      saccoAdminService.assignVehicleToDriver(driverId, vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saccoDrivers"] });
      toast({
        title: "Vehicle assigned",
        description: "The vehicle has been assigned to the driver successfully.",
      });
      setAssigningDriver(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign vehicle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const drivers = data || [];
  const totalPages = Math.ceil((drivers.length || 0) / limit);

  const filteredDrivers = drivers.filter((driver) =>
    driver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone?.includes(searchQuery) ||
    driver.licenseNumber?.includes(searchQuery)
  );

  // Pagination logic
  const paginatedDrivers = filteredDrivers.slice((page - 1) * limit, page * limit);

  const getStatusBadgeVariant = (
    status: string
  ): BadgeVariant => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "suspended":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const handleEditClick = (driver) => {
    setEditingDriver(driver);
  };

  const handleDeleteClick = (driverId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this driver? This action cannot be undone."
      )
    ) {
      deleteDriverMutation.mutate(driverId);
    }
  };

  const handleUpdateSubmit = async (driverData: Partial<Driver>) => {
    if (!editingDriver?.id) return;
    await updateDriverMutation.mutateAsync({ 
      id: editingDriver.id, 
      data: driverData 
    });
  };

  const handleAssignVehicle = (driver: Driver) => {
    setAssigningDriver({
      id: parseInt(driver.id), // Convert string id to number
      name: driver.name
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-x-4">
        <h1 className="text-3xl font-bold">Drivers Management</h1>
        <Button onClick={() => setIsNewDriverOpen(true)}>New Driver</Button>
        <RegisterDriverModal
          open={isNewDriverOpen || editingDriver !== null}
          onClose={() => {
            setIsNewDriverOpen(false);
            setEditingDriver(null);
          }}
          onSubmit={async (data) => {
            if (editingDriver) {
              await handleUpdateSubmit(data);
            } else {
              await createDriverMutation.mutateAsync(data);
            }
          }}
          currentUserRole="sacco_admin"
          initialData={editingDriver} // Changed from driver to initialData
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Management</CardTitle>
          <CardDescription>
            View and manage all drivers registered to your SACCO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-10 bg-muted/50 rounded animate-pulse w-full"></div>
              <div className="h-10 bg-muted/50 rounded animate-pulse w-full"></div>
              <div className="h-10 bg-muted/50 rounded animate-pulse w-full"></div>
            </div>
          ) : paginatedDrivers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>License Expiry</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Total Trips</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.phone || "N/A"}</TableCell>
                      <TableCell>{driver.email || "N/A"}</TableCell>
                      <TableCell>{driver.licenseNumber || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {formatDate(driver.licenseExpiry)}
                        </div>
                      </TableCell>
                      <TableCell>{driver.rating ? driver.rating.toFixed(1) : "0.0"}/5.0</TableCell>
                      <TableCell>{driver.trips_count || 0}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(driver.status)}>
                          {driver.status || "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(driver)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(driver.id)}
                          >
                            Delete
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAssignVehicle(driver)}
                          >
                            Assign Vehicle
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No drivers found matching your search criteria
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={page === i + 1}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                      }
                      aria-disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <AssignVehicleToDriverModal
        driverId={assigningDriver?.id || null}
        open={!!assigningDriver}
        onClose={() => setAssigningDriver(null)}
        driverName={assigningDriver?.name}
      />
    </div>
  );
};

export default SaccoDrivers;