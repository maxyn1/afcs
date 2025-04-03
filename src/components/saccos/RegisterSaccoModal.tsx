import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface RegisterSaccoData {
  name: string;
  registration_number: string;
  contact_email: string;
  contact_phone: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RegisterSaccoData) => Promise<void>;
}

export function RegisterSaccoModal({ open, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterSaccoData>({
    name: '',
    registration_number: '',
    contact_email: '',
    contact_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit(formData);
      setFormData({ name: '', registration_number: '', contact_email: '', contact_phone: '' });
      onClose();
      toast({
        title: "Success",
        description: "SACCO registered successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register SACCO",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New SACCO</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">SACCO Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration">Registration Number</Label>
            <Input
              id="registration"
              required
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone</Label>
            <Input
              id="phone"
              required
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register SACCO"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
