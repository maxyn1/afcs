import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from '@/services/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Star, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RegisterDriverModal } from "@/components/drivers/RegisterDriverModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Driver {
  id: number;
  name: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  saccoName: string;
  rating: number;
  totalTrips: number;
  status: 'active' | 'inactive' | 'suspended';
  phone: string;
  saccoId?: string;
  address?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  vehicle?: {
    registrationNumber: string;
    model: string;
    capacity: number;
    status: 'active' | 'maintenance' | 'inactive';
  };
}

interface DriverDetails extends Driver {
  vehicle?: {
    id: number;
    registrationNumber: string;
    model: string;
    capacity: number;
    status: 'active' | 'inactive' | 'maintenance';
  };
}

interface Sacco {
  id: string;
  name: string;
}

// Add utility functions outside the component
const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return "text-green-500";
  if (rating >= 4.0) return "text-blue-500";
  if (rating >= 3.0) return "text-yellow-500";
  return "text-red-500";
};

const DriverDetailsModal = ({ driverId, open, onClose }: { 
  driverId: number; 
  open: boolean; 
  onClose: () => void 
}) => {
  const { data: details, isLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: async () => {
      const response = await api.get(`/admin/drivers/${driverId}`);
      return response.data as DriverDetails;
    },
    enabled: open
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Driver Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : details ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{details.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={details.status === 'active' ? 'default' : 'secondary'}
                      className={
                        details.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : details.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {details.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Contact Information</p>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{details.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{details.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">License Information</p>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">License Number</p>
                      <p className="font-medium">{details.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expiry Date</p>
                      <p className="font-medium">
                        {new Date(details.licenseExpiry).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">SACCO Information</p>
                  <div className="mt-1">
                    <p className="font-medium">{details.saccoName}</p>
                  </div>
                </div>

                {details.emergencyContact && (
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">{details.emergencyContact}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance & Vehicle Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                      <p className="font-medium flex items-center gap-1">
                        {details.rating}
                        <Star className={`h-4 w-4 fill-current ${getRatingColor(details.rating)}`} />
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Trips</p>
                      <p className="font-medium">{details.totalTrips}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  {details.vehicle ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Registration Number</p>
                          <p className="font-medium">{details.vehicle.registrationNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge
                            variant="outline"
                            className={
                              details.vehicle.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : details.vehicle.status === 'maintenance'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {details.vehicle.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Model</p>
                          <p className="font-medium">{details.vehicle.model}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Capacity</p>
                          <p className="font-medium">{details.vehicle.capacity} seats</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No vehicle currently assigned
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const Drivers = () => {
  // Move all hooks to the top level
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSacco, setFilterSacco] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: driversData, isLoading, error } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      try {
        const response = await axios({
          method: 'GET',
          url: '/admin/drivers',
          baseURL: import.meta.env.VITE_API_BASE_URL,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // Add timeout
        });
        console.log('Drivers data fetched successfully:', response.data);
        return response.data;
      } catch (err) {
        console.error('[Drivers] Error:', err);
        throw new Error(err instanceof Error ? err.message : 'Failed to fetch drivers');
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  // Fetch SACCOs for the select dropdown
  const { data: saccoData } = useQuery({
    queryKey: ['saccos'],
    queryFn: async () => {
      const response = await api.get('/saccos', {
        baseURL: import.meta.env.VITE_API_BASE_URL,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  const saccos = saccoData || [];

  // Move mutations up with other hooks
  const createDriver = useMutation({
    mutationFn: (newDriver: Driver) => {
      // Map frontend Driver type to backend expected fields
      const payload = {
        fullName: newDriver.name,
        email: newDriver.email,
        phone: newDriver.phone,
        licenseNumber: newDriver.licenseNumber,
        licenseExpiry: newDriver.licenseExpiry,
        saccoId: newDriver.saccoId || null,
        address: newDriver.address || '',
        dateOfBirth: newDriver.dateOfBirth || '',
        emergencyContact: newDriver.emergencyContact || '',
        status: newDriver.status || 'inactive',
      };
      return axios.post('/admin/drivers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver registered successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to register driver');
      console.error('Error:', error);
    }
  });

  const updateDriver = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Driver> }) =>
      axios.put(`/admin/drivers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver updated successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update driver');
      console.error('Error:', error);
    }
  });

  const deleteDriver = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`/admin/drivers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver deactivated successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to deactivate driver');
      console.error('Error:', error);
    }
  });

  // Data transformations using useMemo
  const drivers = useMemo(() => {
    if (!driversData || !Array.isArray(driversData)) return [];
    return driversData.map((driver, index) => ({
      ...driver,
      id: driver.id || driver.user_id || `temp-${index}`,
    }));
  }, [driversData]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = 
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.phone.includes(searchQuery);
      const matchesSacco = filterSacco === "all" || driver.saccoName.toLowerCase() === filterSacco.toLowerCase();
      const matchesStatus = filterStatus === "all" || driver.status === filterStatus;
      return matchesSearch && matchesSacco && matchesStatus;
    });
  }, [drivers, searchQuery, filterSacco, filterStatus]);

  const averageRating = useMemo(() => 
    drivers.length 
      ? (drivers.reduce((acc, driver) => acc + driver.rating, 0) / drivers.length).toFixed(1)
      : "0.0"
  , [drivers]);

  const licensesNearExpiry = useMemo(() => 
    drivers.filter(driver => {
      const expiryDate = new Date(driver.licenseExpiry);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow;
    }).length
  , [drivers]);

  // Handler functions
  const handleCreateDriver = async (data: Driver) => {
    try {
      setIsRegisterModalOpen(false); // Close modal first
      await createDriver.mutateAsync(data);
    } catch (error) {
      console.error('Failed to create driver:', error);
      toast.error('Failed to create driver');
      setIsRegisterModalOpen(true); // Reopen modal on error
    }
  };

  // Loading and error states
  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">Loading drivers data...</div>;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50">
        <h3 className="text-lg font-medium text-red-800">Error loading drivers</h3>
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Driver Management</h1>
        <Button className="gap-2" onClick={() => setIsRegisterModalOpen(true)}>
          <UserPlus size={18} />
          Register New Driver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Drivers</p>
                <h2 className="text-2xl font-bold">{drivers.length}</h2>
              </div>
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <h2 className="text-2xl font-bold flex items-center gap-1">
                  {averageRating}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </h2>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">License Renewals Due</p>
                <h2 className="text-2xl font-bold text-orange-500">{licensesNearExpiry}</h2>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search drivers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterSacco} onValueChange={setFilterSacco}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by SACCO" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SACCOs</SelectItem>
                <SelectItem value="metro trans">Metro Trans</SelectItem>
                <SelectItem value="city hoppa">City Hoppa</SelectItem>
                <SelectItem value="forward travelers">Forward Travelers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>License Details</TableHead>
                  <TableHead>SACCO</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-center">Stats</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow key="loading">
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredDrivers.length === 0 ? (
                  <TableRow key="no-data">
                    <TableCell colSpan={7} className="text-center">No drivers found</TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver, index) => (
                    <TableRow 
                      key={`driver-${driver.id || driver.user_id || index}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedDriverId(driver.id)}
                    >
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{driver.phone}</span>
                          <span className="text-muted-foreground">{driver.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{driver.licenseNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            Expires: {new Date(driver.licenseExpiry).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{driver.saccoName}</TableCell>
                      <TableCell>
                        {driver.vehicle ? (
                          <div className="flex flex-col">
                            <span>{driver.vehicle.registrationNumber}</span>
                            <span className="text-xs text-muted-foreground">
                              {driver.vehicle.model} ({driver.vehicle.capacity} seats)
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                driver.vehicle.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : driver.vehicle.status === 'maintenance'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {driver.vehicle.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No vehicle assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center">
                          <span className={`flex items-center gap-1 ${getRatingColor(driver.rating)}`}>
                            {driver.rating}
                            <Star className="h-4 w-4 fill-current" />
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {driver.totalTrips} trips
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={driver.status === 'active' ? 'default' : 'secondary'}
                          className={
                            driver.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : driver.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {driver.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedDriverId && (
        <DriverDetailsModal
          driverId={selectedDriverId}
          open={!!selectedDriverId}
          onClose={() => setSelectedDriverId(null)}
        />
      )}

      <RegisterDriverModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleCreateDriver}
        saccos={saccos}
        currentUserRole="system_admin"
      />
    </div>
  );
};

export default Drivers;
