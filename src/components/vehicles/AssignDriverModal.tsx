import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
}

interface Props {
  vehicleId: number | null;
  open: boolean;
  onClose: () => void;
  vehicleRegistrationNumber?: string;
}

export function AssignDriverModal({ vehicleId, open, onClose, vehicleRegistrationNumber }: Props) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset selected driver when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedDriverId("");
    }
  }, [open]);

  // Fetch available drivers
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['availableDrivers', vehicleId],
    queryFn: () => vehicleId ? saccoAdminService.getAvailableDrivers(vehicleId) : Promise.resolve([]),
    enabled: !!vehicleId && open,
  });

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
      toast({
        title: "Error",
        description: error.message || "Failed to assign driver",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      toast({
        title: "Error",
        description: "Please select a driver",
        variant: "destructive",
      });
      return;
    }
    assignDriverMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver to Vehicle {vehicleRegistrationNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Driver</Label>
            <Select
              value={selectedDriverId}
              onValueChange={setSelectedDriverId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver: Driver) => (
                  <SelectItem key={driver.id} value={driver.id.toString()}>
                    {driver.name} - {driver.licenseNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={assignDriverMutation.isPending || !selectedDriverId}
            >
              {assignDriverMutation.isPending ? "Assigning..." : "Assign Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}