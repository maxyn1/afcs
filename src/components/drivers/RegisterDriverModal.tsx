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
  onSubmit: (data: any) => Promise<void>;
  saccos: Array<{ id: number; name: string }>;
  currentUserRole: 'system_admin' | 'sacco_admin';
  currentSaccoId?: number; // Only needed for SACCO admins
}

export function RegisterDriverModal({ 
  open, 
  onClose, 
  onSubmit, 
  saccos, 
  currentUserRole,
  currentSaccoId 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // User table fields
    name: "",
    email: "",
    phone: "",
    
    // Driver table fields
    licenseNumber: "",
    licenseExpiry: "",
    saccoId: currentUserRole === 'sacco_admin' ? currentSaccoId?.toString() || "" : "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Create the driver data structure to match our database needs
      const driverData = {
        // User table data
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.licenseNumber.toUpperCase(), // License as uppercase password
        role: 'driver',
        
        // Driver table data
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        saccoId: parseInt(formData.saccoId),
        status: 'inactive', // Drivers start as inactive until approved
      };
      
      await onSubmit(driverData);
      onClose();
    } catch (error) {
      console.error('Failed to register driver:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New Driver</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* User table fields */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          {/* Driver table fields */}
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number <span className="text-red-500">*</span></Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500">This will be used as their initial password (in UPPERCASE)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseExpiry">License Expiry <span className="text-red-500">*</span></Label>
            <Input
              id="licenseExpiry"
              type="date"
              value={formData.licenseExpiry}
              onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            {currentUserRole === 'system_admin' ? (
              <>
                <Label htmlFor="sacco">SACCO <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.saccoId}
                  onValueChange={(value) => setFormData({ ...formData, saccoId: value })}
                >
                  <SelectTrigger id="sacco">
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
              </>
            ) : (
              <>
                <Label>SACCO</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-gray-100">
                  {saccos.find(s => s.id === parseInt(formData.saccoId))?.name || "Loading..."}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Registering..." : "Register Driver"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}