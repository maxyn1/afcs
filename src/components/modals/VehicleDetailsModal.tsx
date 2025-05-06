import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bus, Calendar, Wrench, Shield } from "lucide-react";
import { format } from "date-fns";
import type { VehicleInfo } from "@/services/driverService";

function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleInfo: VehicleInfo | null;
  isLoading: boolean;
}

export function VehicleDetailsModal({
  isOpen,
  onClose,
  vehicleInfo,
  isLoading,
}: VehicleDetailsModalProps) {
  if (!vehicleInfo && !isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Vehicle Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : vehicleInfo ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Bus className="h-12 w-12 text-primary" />
              <div>
                <h3 className="font-bold text-lg">{vehicleInfo.registration_number}</h3>
                <p className="text-muted-foreground">
                  {vehicleInfo.make} {vehicleInfo.model} ({vehicleInfo.year})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">SACCO</p>
                <Badge variant="outline">{vehicleInfo.sacco_name}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge 
                  variant={vehicleInfo.vehicle_status === 'active' ? 'default' : 'secondary'}
                >
                  {vehicleInfo.vehicle_status}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Insurance Expires:</span>
                <span>{isValidDate(vehicleInfo.insurance_expiry) ? format(new Date(vehicleInfo.insurance_expiry), 'PPP') : 'N/A'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last Maintenance:</span>
                <span>{isValidDate(vehicleInfo.last_maintenance) ? format(new Date(vehicleInfo.last_maintenance), 'PPP') : 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Capacity:</span>
                <span>{vehicleInfo.capacity} seats</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No vehicle information available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
