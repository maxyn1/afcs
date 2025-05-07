import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import saccoAdminService from "@/services/saccoAdminService";

interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  status: string;
}

interface Props {
  vehicleId: number | null;
  open: boolean;
  onClose: () => void;
  vehicleRegistrationNumber?: string;
}

export function AssignVehicleToDriverModal({ vehicleId, open, onClose, vehicleRegistrationNumber }: Props) {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDrivers() {
      try {
        const driversData = await fetchDrivers();
        setDrivers(driversData);
      } catch (error) {
        setError('Failed to load drivers');
      } finally {
        setIsLoading(false);
      }
    }

    loadDrivers();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission logic
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver to Vehicle {vehicleRegistrationNumber}</DialogTitle>
          <DialogDescription>
            Select a driver to assign to this vehicle
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
                  <SelectItem key="loading" value="loading" disabled>
                    Loading drivers...
                  </SelectItem>
                ) : drivers.length === 0 ? (
                  <SelectItem key="none" value="none" disabled>
                    No available drivers found
                  </SelectItem>
                ) : (
                  drivers.map((driver) => (
                    <SelectItem 
                      key={`driver-${driver.id}`} 
                      value={driver.id.toString()}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{driver.name} - {driver.licenseNumber}</span>
                        <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                          {driver.status}
                        </Badge>
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
              disabled={!selectedDriverId}
            >
              Assign Driver
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}