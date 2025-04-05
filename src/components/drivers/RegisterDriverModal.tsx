import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { fullName: string; phone: string; licenseNumber: string; licenseExpiry: string; saccoId: string }) => Promise<void>;
  saccos: Array<{ id: number; name: string }>;
}

export function RegisterDriverModal({ open, onClose, onSubmit, saccos }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    licenseNumber: "",
    licenseExpiry: "",
    saccoId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to register driver:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Driver</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license">License Number</Label>
            <Input
              id="license"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">License Expiry Date</Label>
            <Input
              id="expiry"
              type="date"
              value={formData.licenseExpiry}
              onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>SACCO</Label>
            <Select 
              value={formData.saccoId}
              onValueChange={(value) => setFormData({ ...formData, saccoId: value })}
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
