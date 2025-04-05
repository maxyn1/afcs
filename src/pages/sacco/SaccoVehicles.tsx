
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import saccoAdminService from "@/services/saccoAdminService";
import vehicleService, { Vehicle } from "@/services/vehicleService";
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
import { Car, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SaccoVehicles = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({
    registration_number: "",
    capacity: "14",
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    sacco_id: "",
  });
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['saccoVehicles'],
    queryFn: saccoAdminService.getVehicles,
  });

  const createVehicleMutation = useMutation({
    mutationFn: (vehicleData: Partial<Vehicle>) => vehicleService.createVehicle(vehicleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saccoVehicles'] });
      toast({
        title: "Vehicle created",
        description: "The vehicle has been registered successfully.",
      });
      setIsNewVehicleOpen(false);
      setNewVehicleData({
        registration_number: "",
        capacity: "14",
        make: "",
        model: "",
        year: new Date().getFullYear().toString(),
        sacco_id: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register vehicle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNewVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVehicleMutation.mutate({
      ...newVehicleData,
      capacity: parseInt(newVehicleData.capacity),
      year: parseInt(newVehicleData.year),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVehicleData((prev) => ({ ...prev, [name]: value }));
  };

  const vehicles = data || [];

  const filteredVehicles = vehicles.filter((vehicle: Vehicle) => 
    vehicle.registration_number.toLowerCase().includes(searchQuery.toLowerCase())
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
                    name="registration_number"
                    placeholder="KDG 123A"
                    value={newVehicleData.registration_number}
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
                    <TableHead>Capacity</TableHead>
                    <TableHead>Make/Model</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle: Vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.registration_number}</TableCell>
                      <TableCell>{vehicle.capacity} seats</TableCell>
                      <TableCell>{vehicle.sacco_name}</TableCell>
                      <TableCell>{vehicle.route || "Not assigned"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Assign Route
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
    </div>
  );
};

export default SaccoVehicles;
