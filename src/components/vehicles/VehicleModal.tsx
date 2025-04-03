import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Vehicle } from "@/services/vehicleService";

interface Props {
  vehicle?: Vehicle;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Vehicle>) => Promise<void>;
  saccos: Array<{ id: number; name: string }>;
}

export function VehicleModal({ vehicle, open, onClose, onSubmit, saccos }: Props) {
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    registration_number: '',
    sacco_id: undefined,
    capacity: 0,
    status: 'active'
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        registration_number: vehicle.registration_number,
        sacco_id: vehicle.sacco_id,
        capacity: vehicle.capacity,
        status: vehicle.status
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Registration Number</Label>
            <Input
              value={formData.registration_number}
              onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>SACCO</Label>
            <Select
              value={formData.sacco_id?.toString()}
              onValueChange={(value) => setFormData({...formData, sacco_id: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select SACCO" />
              </SelectTrigger>
              <SelectContent>
                {saccos.map((sacco) => (
                  <SelectItem key={sacco.id} value={sacco.id.toString()}>
                    {sacco.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'maintenance' | 'retired') => 
                setFormData({...formData, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {vehicle ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
