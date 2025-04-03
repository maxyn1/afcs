import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Vehicle {
  id: number;
  registration_number: string;
  capacity: number;
  status: string;
}

interface SaccoDetails {
  id: number;
  name: string;
  registration_number: string;
  contact_email: string;
  contact_phone: string;
  status: 'active' | 'suspended' | 'inactive';
  address?: string;
  founded_date?: string;
  vehicles: Vehicle[];
  vehicle_count: number;
  route_count: number;
}

interface Props {
  sacco: SaccoDetails | null;
  open: boolean;
  onClose: () => void;
  loading?: boolean;
}

export function SaccoModal({ sacco, open, onClose, loading = false }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{loading ? 'Loading...' : sacco?.name}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sacco ? (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <h3 className="font-semibold mb-4">SACCO Details</h3>
                <div className="space-y-2">
                  <p><span className="text-muted-foreground">Registration:</span> {sacco.registration_number}</p>
                  <p><span className="text-muted-foreground">Contact Email:</span> {sacco.contact_email}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {sacco.contact_phone}</p>
                  <p><span className="text-muted-foreground">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      sacco.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sacco.status}
                    </span>
                  </p>
                  {sacco.founded_date && (
                    <p><span className="text-muted-foreground">Founded:</span> {new Date(sacco.founded_date).toLocaleDateString()}</p>
                  )}
                  {sacco.address && (
                    <p><span className="text-muted-foreground">Address:</span> {sacco.address}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Fleet Information</h3>
                <div className="space-y-2">
                  <p><span className="text-muted-foreground">Total Vehicles:</span> {sacco.vehicle_count}</p>
                  <p><span className="text-muted-foreground">Active Routes:</span> {sacco.route_count}</p>
                </div>
              </div>
              
              <div className="col-span-2">
                <h3 className="font-semibold mb-4">Registered Vehicles</h3>
                <div className="border rounded-lg">
                  {sacco.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-3 border-b last:border-b-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{vehicle.registration_number}</p>
                          <p className="text-sm text-muted-foreground">Capacity: {vehicle.capacity}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          vehicle.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No SACCO data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
