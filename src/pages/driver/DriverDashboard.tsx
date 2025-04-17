import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Bus, CreditCard, Users, Route as RouteIcon, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import driverService from "@/services/driverService";
import { VehicleDetailsModal } from "@/components/modals/VehicleDetailsModal";

const DriverDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [todayTrips, setTodayTrips] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [currentRoute, setCurrentRoute] = useState("Not assigned");
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);

  const { data: dashboardStats, error: statsError, isLoading: statsLoading } = useQuery({
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
    mutationFn: (newStatus: boolean) => {
      console.log('Updating driver status to:', newStatus ? 'active' : 'inactive');
      return driverService.updateStatus(newStatus ? 'active' : 'inactive');
    },
    onSuccess: () => {
      console.log('Status updated successfully');
      toast({
        title: isOnline ? "You are now offline" : "You are now online",
        description: isOnline ? "You won't receive any trip requests" : "You can now receive trip requests",
      });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      setIsOnline(!isOnline); // Revert state
      toast({
        title: "Update failed",
        description: "Failed to update your status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const toggleOnlineStatus = () => {
    console.log('Toggling online status. Current:', isOnline);
    setIsOnline(!isOnline);
    statusMutation.mutate(!isOnline);
  };

  const handleViewVehicleDetails = async () => {
    setShowVehicleModal(true);
    setIsLoadingVehicle(true);
    try {
      const data = await driverService.getVehicleInfo();
      setVehicleInfo(data);
    } catch (error) {
      console.error('Failed to load vehicle info:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicle information",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVehicle(false);
    }
  };

  if (statsLoading) {
    console.log('Loading dashboard stats...');
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (statsError) {
    console.error('Dashboard stats error:', statsError);
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
              +2.1% from yesterday
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
          <div className="flex items-center gap-4">
            <Bus className="h-10 w-10 text-primary" />
            <div>
              <h3 className="font-bold">KBX 123A</h3>
              <p className="text-muted-foreground">33 Seater Bus</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="outline">Metro SACCO</Badge>
            <Badge variant="outline" className="bg-green-50">Maintenance Up-to-date</Badge>
          </div>
          <Button variant="outline" onClick={handleViewVehicleDetails}>
            View Details
          </Button>
        </CardContent>
      </Card>

      <VehicleDetailsModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        vehicleInfo={vehicleInfo}
        isLoading={isLoadingVehicle}
      />
    </div>
  );
};

export default DriverDashboard;
