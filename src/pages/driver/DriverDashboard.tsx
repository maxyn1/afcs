import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Bus, CreditCard, Users, Route as RouteIcon, Clock, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, UseQueryResult } from "@tanstack/react-query";
import driverService from "@/services/driverService";
import { VehicleDetailsModal } from "@/components/modals/VehicleDetailsModal";
import type { VehicleInfo, DashboardStats } from "@/services/driverService";

const DriverDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [todayTrips, setTodayTrips] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [currentRoute, setCurrentRoute] = useState("Not assigned");
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Fetch vehicle info
  const { data: vehicle, isLoading: vehicleLoading } = useQuery<VehicleInfo, Error>({
    queryKey: ['driverVehicle'],
    queryFn: () => driverService.getVehicleInfo(),
    retry: (failureCount, error) => {
      // Don't retry if no vehicle is assigned
      return !error.message?.includes('No vehicle currently assigned') && failureCount < 3;
    }
  });

  const { data: dashboardStats, error: statsError, isLoading: statsLoading } = useQuery<DashboardStats, Error>({
    queryKey: ['driverDashboardStats'],
    queryFn: async () => {
      try {
        console.log('Fetching dashboard stats...');
        const data = await driverService.getDashboardStats();
        console.log('Dashboard stats fetched successfully:', data);
        setTodayTrips(data.todayTrips);
        setTodayEarnings(data.todayEarnings);
        setTotalPassengers(data.totalPassengers);
        setCurrentRoute(data.currentRoute);
        setIsOnline(data.isOnline);
        return data;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        });
        throw error;
      }
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'active' | 'inactive') => driverService.updateStatus(status),
    onSuccess: () => {
      setIsOnline(!isOnline);
      toast({
        description: `You are now ${!isOnline ? 'online' : 'offline'}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  });

  const toggleOnlineStatus = () => {
    statusMutation.mutate(isOnline ? 'inactive' : 'active');
  };

  const handleViewVehicleDetails = () => {
    setShowVehicleModal(true);
  };

  if (statsLoading || vehicleLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (statsError) {
    return <div className="p-4 text-red-500">Error loading dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your trips today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={!isOnline ? "default" : "outline"} className={`px-3 py-1.5 ${!isOnline ? "bg-green-500 hover:bg-green-600" : ""}`}>
            {isOnline ? "Offline" : "Online"}
          </Badge>
          <Button onClick={toggleOnlineStatus}>
            {isOnline ? "Go Online" : "Go Offline"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Trips</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTrips}</div>
            <p className="text-xs text-muted-foreground">
              completed trips
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {todayEarnings}</div>
            <p className="text-xs text-muted-foreground">
              total earnings today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPassengers}</div>
            <p className="text-xs text-muted-foreground">
              total passengers today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Route</CardTitle>
            <RouteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{currentRoute}</div>
            <p className="text-xs text-muted-foreground">
              assigned by SACCO
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {vehicle ? (
            <>
              <div className="flex items-center gap-4">
                <Bus className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-bold">{vehicle.registration_number}</h3>
                  <p className="text-muted-foreground">{vehicle.capacity} Seater {vehicle.make} {vehicle.model}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant="outline">{vehicle.sacco_name}</Badge>
                <Badge variant="outline" className={vehicle.vehicle_status === 'active' ? 'bg-green-50' : 'bg-amber-50'}>
                  {vehicle.vehicle_status === 'active' ? 'Active' : 'Maintenance Required'}
                </Badge>
              </div>
              <Button variant="outline" onClick={handleViewVehicleDetails}>
                View Details
              </Button>
            </>
          ) : (
            <div className="w-full text-center py-6">
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <h3 className="font-semibold">No Vehicle Assigned</h3>
                <p className="text-muted-foreground">Contact your SACCO administrator to get a vehicle assigned.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <VehicleDetailsModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        vehicleInfo={vehicle}
        isLoading={vehicleLoading}
      />
    </div>
  );
};

export default DriverDashboard;
