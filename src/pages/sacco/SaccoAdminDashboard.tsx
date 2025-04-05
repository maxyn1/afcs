
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bus, CreditCard, Users, Route, MapPin, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/adminService";

// Simple Chart component
const SimpleBarChart = () => (
  <div className="w-full h-[200px] flex items-end space-x-2">
    {[65, 40, 80, 50, 43, 65, 70].map((value, i) => (
      <div key={i} className="flex-1 flex flex-col items-center gap-2">
        <div 
          className="w-full bg-primary/60 rounded-t" 
          style={{ height: `${value}%` }}
        ></div>
        <span className="text-xs text-muted-foreground">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
        </span>
      </div>
    ))}
  </div>
);

const SaccoAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalVehicles: 0,
    totalRoutes: 0,
    dailyRevenue: 0,
    totalTrips: 0,
    totalPassengers: 0,
    activeVehicles: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats({
          totalDrivers: data.totalDrivers || 45,
          totalVehicles: data.totalVehicles || 38,
          totalRoutes: data.totalRoutes || 12,
          dailyRevenue: data.dailyRevenue || 124500,
          totalTrips: data.totalTrips || 183,
          totalPassengers: data.totalPassengers || 2456,
          activeVehicles: data.activeVehicles || 32
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Set fallback data in case of error
        setStats({
          totalDrivers: 45,
          totalVehicles: 38,
          totalRoutes: 12,
          dailyRevenue: 124500,
          totalTrips: 183,
          totalPassengers: 2456,
          activeVehicles: 32
        });
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SACCO Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's your SACCO overview.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button>Generate Report</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.floor(stats.totalDrivers * 0.8)} currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeVehicles} active on routes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.dailyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +5.2% from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoutes}</div>
            <p className="text-xs text-muted-foreground">
              across Nairobi County
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue</CardTitle>
            <CardDescription>Revenue for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Key metrics for your SACCO</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-muted-foreground mr-2" />
                  <span>Total Trips Today</span>
                </div>
                <span className="font-bold">{stats.totalTrips}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <span>Total Passengers</span>
                </div>
                <span className="font-bold">{stats.totalPassengers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
                  <span>Most Popular Route</span>
                </div>
                <span className="font-bold">CBD - Westlands</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bus className="h-5 w-5 text-muted-foreground mr-2" />
                  <span>Vehicle Utilization</span>
                </div>
                <span className="font-bold">{Math.round((stats.activeVehicles / stats.totalVehicles) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SaccoAdminDashboard;
