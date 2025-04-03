import { useState, useEffect } from "react";
import api from "@/services/api";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, PlusCircle, Search } from "lucide-react";
import { SaccoModal } from "@/components/saccos/SaccoModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditSaccoModal } from "@/components/saccos/EditSaccoModal";
import { RegisterSaccoModal } from "@/components/saccos/RegisterSaccoModal";

interface Vehicle {
  id: number;
  registration_number: string;
  capacity: number;
  status: string;
}

interface Sacco {
  id: number;
  name: string;
  registration_number: string;
  contact_email: string;
  contact_phone: string;
  status: 'active' | 'suspended' | 'inactive';
  vehicle_count: number;
  route_count: number;
  vehicles: Vehicle[];
}

const Saccos = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [saccos, setSaccos] = useState<Sacco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSacco, setSelectedSacco] = useState<Sacco | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingSacco, setEditingSacco] = useState<Sacco | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saccoToDelete, setSaccoToDelete] = useState<number | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    const fetchSaccos = async () => {
      try {
        setLoading(true);
        const response = await api.get('/saccos');
        console.log('SACCOs response:', response.data);
        setSaccos(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching SACCOs:', err);
        setError('Failed to load SACCOs');
        setSaccos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSaccos();
  }, []);

  const handleSaccoClick = async (saccoId: number) => {
    try {
      setModalLoading(true);
      const response = await api.get(`/saccos/${saccoId}`);
      setSelectedSacco(response.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching SACCO details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = async (sacco: Sacco) => {
    setEditingSacco(sacco);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (saccoId: number) => {
    try {
      await api.delete(`/saccos/${saccoId}`);
      setSaccos(saccos.filter(s => s.id !== saccoId));
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Error deleting SACCO:', err);
    }
  };

  const handleUpdateSacco = async (updatedSacco: Partial<Sacco>) => {
    try {
      const response = await api.put(`/saccos/${editingSacco?.id}`, updatedSacco);
      setSaccos(saccos.map(s => s.id === editingSacco?.id ? { ...s, ...response.data } : s));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating SACCO:', err);
    }
  };

  const handleRegisterSacco = async (data: Omit<Sacco, 'id' | 'vehicle_count' | 'route_count' | 'vehicles'>) => {
    try {
      const response = await api.post('/saccos', data);
      setSaccos([...saccos, response.data]);
      setIsRegisterModalOpen(false);
    } catch (err) {
      console.error('Error registering SACCO:', err);
      throw err; // Let the modal handle the error
    }
  };

  const filteredSaccos = saccos.filter(sacco => 
    sacco.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sacco.contact_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">SACCO Management</h1>
        <Button className="gap-2" onClick={() => setIsRegisterModalOpen(true)}>
          <PlusCircle size={18} />
          Register New SACCO
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={20} />
            Registered SACCOs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search SACCOs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-2 p-4 font-medium bg-muted/50">
              <div className="col-span-3">SACCO Name</div>
              <div className="col-span-1">Vehicles</div>
              <div className="col-span-1">Routes</div>
              <div className="col-span-2">Contact Email</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Actions</div>
            </div>
            {filteredSaccos.length > 0 ? (
              filteredSaccos.map((sacco) => (
                <div key={sacco.id} className="grid grid-cols-12 gap-2 p-4 border-t items-center">
                  <div 
                    className="col-span-10 grid grid-cols-10 gap-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSaccoClick(sacco.id)}
                  >
                    <div className="col-span-3 font-medium">{sacco.name}</div>
                    <div className="col-span-1">{sacco.vehicle_count}</div>
                    <div className="col-span-1">{sacco.route_count}</div>
                    <div className="col-span-2">{sacco.contact_email}</div>
                    <div className="col-span-2">{sacco.contact_phone}</div>
                    <div className="col-span-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sacco.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sacco.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(sacco);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSaccoToDelete(sacco.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No SACCOs found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <SaccoModal 
        sacco={selectedSacco}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        loading={modalLoading}
      />

      <EditSaccoModal
        sacco={editingSacco}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateSacco}
      />

      <RegisterSaccoModal 
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleRegisterSacco}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the SACCO and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => saccoToDelete && handleDelete(saccoToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Saccos;
