import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface Sacco {
  id: number;
  name: string;
  registration_number: string;
  contact_email: string;
  contact_phone: string;
  status: 'active' | 'suspended' | 'inactive';
}

interface Props {
  sacco: Sacco | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Sacco>) => Promise<void>;
}

export function EditSaccoModal({ sacco, open, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Sacco>>({
    name: '',
    registration_number: '',
    contact_email: '',
    contact_phone: ''
  });

  // Update form data when sacco changes
  useEffect(() => {
    if (sacco) {
      setFormData({
        name: sacco.name,
        registration_number: sacco.registration_number,
        contact_email: sacco.contact_email,
        contact_phone: sacco.contact_phone
      });
    }
  }, [sacco]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to update SACCO:', error);
      // You might want to show an error toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit SACCO: {sacco?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">SACCO Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration">Registration Number</Label>
            <Input
              id="registration"
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone</Label>
            <Input
              id="phone"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
