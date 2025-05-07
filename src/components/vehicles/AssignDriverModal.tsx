import { useState, useEffect, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import saccoAdminService from "@/services/saccoAdminService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
}

interface Props {
  vehicleId: number | null;
  open: boolean;
  onClose: () => void;
  vehicleRegistrationNumber?: string;
}

export function AssignDriverModal({ vehicleId, open, onClose, vehicleRegistrationNumber }: Props) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset selected driver and error when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedDriverId("");
      setError("");
    }
  }, [open]);

  // Fetch available drivers
  const { data: rawDrivers = [], isLoading } = useQuery({
    queryKey: ['availableDrivers', vehicleId],
    queryFn: () => vehicleId ? saccoAdminService.getAvailableDrivers(vehicleId) : Promise.resolve([]),
    enabled: !!vehicleId && open,
  });

  // Deduplicate drivers based on ID
  const drivers = useMemo(() => {
    const uniqueDrivers = new Map();
    rawDrivers.forEach(driver => {
      if (!uniqueDrivers.has(driver.id)) {
        uniqueDrivers.set(driver.id, driver);
      }
    });
    return Array.from(uniqueDrivers.values());
  }, [rawDrivers]);

  // Assign driver mutation
  const assignDriverMutation = useMutation({
    mutationFn: () => {
      if (!vehicleId || !selectedDriverId) throw new Error('Missing required data');
      return saccoAdminService.assignDriver(vehicleId, parseInt(selectedDriverId));
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Driver assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['availableDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
    onError: (error: Error) => {
      const message = error.message || "Failed to assign driver";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    
    if (!selectedDriverId) {
      setError("Please select a driver");
      return;
    }
    assignDriverMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver to Vehicle {vehicleRegistrationNumber}</DialogTitle>
          <DialogDescription>
            Select an available driver to assign to this vehicle. Both active and inactive drivers can be assigned.
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
            <Label>Select Driver</Label>
            <Select
              value={selectedDriverId}
              onValueChange={(value) => {
                setSelectedDriverId(value);
                setError(""); // Clear error when selection changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading drivers...
                  </SelectItem>
                ) : drivers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No available drivers found
                  </SelectItem>
                ) : (
                  drivers.map((driver: Driver) => (
                    <SelectItem 
                      key={driver.id} 
                      value={driver.id.toString()}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{driver.name} - {driver.licenseNumber}</span>
                        {getStatusBadge(driver.status)}
                      </div>
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
              disabled={assignDriverMutation.isPending || !selectedDriverId}
            >
              {assignDriverMutation.isPending ? "Assigning..." : "Assign Driver"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}