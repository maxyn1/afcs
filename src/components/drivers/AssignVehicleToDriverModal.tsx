import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import saccoAdminService from "@/services/saccoAdminService";

interface Vehicle {
  id: number;
  registrationNumber: string;
  status: string;
  capacity: number;
}

interface Props {
  driverId: number | null;
  open: boolean;
  onClose: () => void;
  driverName?: string;
}

export function AssignVehicleToDriverModal({ driverId, open, onClose, driverName }: Props) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedVehicleId("");
      setError("");
    }
  }, [open]);

  // Query for available vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['availableVehicles', driverId],
    queryFn: async () => {
      if (!driverId) return [];
      try {
        console.log('[AssignVehicleToDriverModal] Fetching available vehicles');
        const data = await saccoAdminService.getAvailableVehicles();
        console.log('[AssignVehicleToDriverModal] Available vehicles:', data.length);
        return data;
      } catch (error) {
        console.error('[AssignVehicleToDriverModal] Error fetching vehicles:', error);
        throw new Error('Failed to load vehicles');
      }
    },
    enabled: !!driverId && open,
  });

  // Assignment mutation
  const assignVehicleMutation = useMutation({
    mutationFn: () => {
      if (!driverId || !selectedVehicleId) {
        throw new Error('Missing required data');
      }
      console.log('[AssignVehicleToDriverModal] Assigning vehicle:', {
        driverId,
        vehicleId: selectedVehicleId
      });
      return saccoAdminService.assignVehicleToDriver(driverId, parseInt(selectedVehicleId));
    },
    onSuccess: () => {
      console.log('[AssignVehicleToDriverModal] Assignment successful');
      toast({
        title: "Success",
        description: "Vehicle assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['saccoDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['availableVehicles'] });
      onClose();
    },
    onError: (error: Error) => {
      console.error('[AssignVehicleToDriverModal] Assignment failed:', error);
      setError(error.message || "Failed to assign vehicle");
      toast({
        title: "Error",
        description: error.message || "Failed to assign vehicle",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      setError("Please select a vehicle");
      return;
    }
    assignVehicleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Vehicle to {driverName}</DialogTitle>
          <DialogDescription>
            Select an available vehicle to assign to this driver.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Select Vehicle</Label>
            <Select
              value={selectedVehicleId}
              onValueChange={(value) => {
                setSelectedVehicleId(value);
                setError("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading vehicles...
                  </SelectItem>
                ) : vehicles.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No available vehicles found
                  </SelectItem>
                ) : (
                  // Using a guaranteed unique key
                  vehicles.map((vehicle: Vehicle) => (
                    <SelectItem 
                      key={`vehicle-${vehicle.id}`} 
                      value={vehicle.id.toString()}
                    >
                      {vehicle.registrationNumber} ({vehicle.capacity} seats)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={assignVehicleMutation.isPending || !selectedVehicleId}
            >
              {assignVehicleMutation.isPending ? "Assigning..." : "Assign Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}