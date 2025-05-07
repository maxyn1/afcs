import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import saccoAdminService from "@/services/saccoAdminService";
import vehicleService, { Vehicle } from "@/services/vehicleService";
import { useAuth } from "@/contexts/AuthContext";
import { AssignDriverModal } from "@/components/vehicles/AssignDriverModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SaccoVehicles = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [selectedVehicleForDriver, setSelectedVehicleForDriver] = useState<Vehicle | null>(null);
  const [newVehicleData, setNewVehicleData] = useState<{
    registrationNumber: string;
    capacity: number;
    make: string;
    model: string;
    year: number;
    sacco_id: string;
    status: 'active' | 'maintenance' | 'retired';
  }>({
    registrationNumber: "",
    capacity: 14,
    make: "",
    model: "",
    year: new Date().getFullYear(),
    sacco_id: user?.sacco_id || "",
    status: "active"
  });

  const queryClient = useQueryClient();

  const { data: rawVehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: saccoAdminService.getVehicles,
  });

  // Deduplicate vehicles based on ID
  const vehicles = useMemo(() => {
    const uniqueVehicles = new Map();
    rawVehicles.forEach(vehicle => {
      if (!uniqueVehicles.has(vehicle.id)) {
        uniqueVehicles.set(vehicle.id, vehicle);
      }
    });
    return Array.from(uniqueVehicles.values());
  }, [rawVehicles]);

  const createVehicleMutation = useMutation({
    mutationFn: (vehicleData: Partial<Vehicle>) => {
      return vehicleService.createVehicle(vehicleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle has been registered successfully.",
      });
      setIsNewVehicleOpen(false);
      setNewVehicleData({
        registrationNumber: "",
        capacity: 14,
        make: "",
        model: "",
        year: new Date().getFullYear(),
        sacco_id: user?.sacco_id || "",
        status: "active"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register vehicle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Vehicle> }) =>
      vehicleService.updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle updated successfully",
      });
      setIsEditVehicleOpen(false);
      setSelectedVehicle(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: number) => vehicleService.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vehicle",
        variant: "destructive",
      });
    },
  });

  const handleNewVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVehicleMutation.mutate(newVehicleData);
  };

  const handleEditVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle?.id) return;

    updateVehicleMutation.mutate({
      id: selectedVehicle.id,
      data: newVehicleData,
    });
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    deleteVehicleMutation.mutate(id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVehicleData((prev) => ({ 
      ...prev, 
      [name]: name === 'capacity' || name === 'year' ? parseInt(value) : value 
    }));
  };

  const handleStatusChange = (value: 'active' | 'maintenance' | 'retired') => {
    setNewVehicleData(prev => ({
      ...prev,
      status: value
    }));
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setNewVehicleData({
      registrationNumber: vehicle.registrationNumber,
      capacity: vehicle.capacity,
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year || new Date().getFullYear(),
      sacco_id: vehicle.sacco_id,
      status: vehicle.status || "active"
    });
    setIsEditVehicleOpen(true);
  };

  const handleAssignDriver = (vehicle: Vehicle) => {
    setSelectedVehicleForDriver(vehicle);
    setIsAssignDriverOpen(true);
  };

  const filteredVehicles = vehicles.filter((vehicle) => 
    (vehicle.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "active":
        return "default";
      case "maintenance":
        return "secondary";
      case "retired":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getMakeModel = (vehicle: Vehicle) => {
    const make = vehicle.make || 'Not specified';
    const model = vehicle.model || 'Not specified';
    return make === 'Not specified' && model === 'Not specified' 
      ? 'Make/Model not specified'
      : `${make} ${model}`;
  };

  const getYear = (year: number | null | undefined) => {
    return year ? year.toString() : 'Year not specified';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vehicles Management</h1>
        <Dialog open={isNewVehicleOpen} onOpenChange={setIsNewVehicleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Vehicle</DialogTitle>
              <DialogDescription>
                Fill out the form below to register a new vehicle to your SACCO.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleNewVehicleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input
                    id="registration_number"
                    name="registrationNumber"
                    placeholder="KDG 123A"
                    value={newVehicleData.registrationNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      name="make"
                      placeholder="Toyota"
                      value={newVehicleData.make}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="Hiace"
                      value={newVehicleData.model}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      min="1990"
                      max={new Date().getFullYear()}
                      value={newVehicleData.year}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Seating Capacity</Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      max="50"
                      value={newVehicleData.capacity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newVehicleData.status}
                    onValueChange={(value: 'active' | 'maintenance' | 'retired') => handleStatusChange(value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="status-active" value="active">Active</SelectItem>
                      <SelectItem key="status-maintenance" value="maintenance">Maintenance</SelectItem>
                      <SelectItem key="status-retired" value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewVehicleOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createVehicleMutation.isPending}>
                  {createVehicleMutation.isPending ? "Registering..." : "Register Vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Management</CardTitle>
          <CardDescription>
            View and manage all vehicles in your SACCO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by registration number..."
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
          ) : filteredVehicles.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reg Number</TableHead>
                    <TableHead>Make/Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={`vehicle-${vehicle.id}`}>
                      <TableCell className="font-medium">
                        {vehicle.registrationNumber}
                      </TableCell>
                      <TableCell>{getMakeModel(vehicle)}</TableCell>
                      <TableCell>{getYear(vehicle.year)}</TableCell>
                      <TableCell>{vehicle.capacity} seats</TableCell>
                      <TableCell>{vehicle.route || "Not assigned"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(vehicle)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignDriver(vehicle)}
                          >
                            Assign Driver
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
              No vehicles found matching your search criteria
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditVehicleOpen} onOpenChange={setIsEditVehicleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update the details of the selected vehicle.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditVehicleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  name="registrationNumber"
                  placeholder="KDG 123A"
                  value={newVehicleData.registrationNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    name="make"
                    placeholder="Toyota"
                    value={newVehicleData.make}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    placeholder="Hiace"
                    value={newVehicleData.model}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear()}
                    value={newVehicleData.year}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Seating Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    max="50"
                    value={newVehicleData.capacity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newVehicleData.status}
                  onValueChange={(value: 'active' | 'maintenance' | 'retired') => handleStatusChange(value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="status-active" value="active">Active</SelectItem>
                    <SelectItem key="status-maintenance" value="maintenance">Maintenance</SelectItem>
                    <SelectItem key="status-retired" value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditVehicleOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateVehicleMutation.isPending}>
                {updateVehicleMutation.isPending ? "Updating..." : "Update Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AssignDriverModal
        vehicleId={selectedVehicleForDriver?.id || null}
        open={isAssignDriverOpen}
        onClose={() => {
          setIsAssignDriverOpen(false);
          setSelectedVehicleForDriver(null);
        }}
        vehicleRegistrationNumber={selectedVehicleForDriver?.registrationNumber}
      />
    </div>
  );
};

export default SaccoVehicles;
