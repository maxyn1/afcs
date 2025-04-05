
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Bus, CreditCard, Users, Route as RouteIcon, Clock } from "lucide-react";

const DriverDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [todayTrips, setTodayTrips] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [currentRoute, setCurrentRoute] = useState("Not assigned");

  useEffect(() => {
    // This would be replaced with actual API calls
    setTodayTrips(4);
    setTodayEarnings(2500);
    setTotalPassengers(32);
    setCurrentRoute("Nairobi CBD - Westlands");
  }, []);

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast({
      title: !isOnline ? "You are now online" : "You are now offline",
      description: !isOnline ? "You can now receive trip requests" : "You won't receive any trip requests",
      variant: !isOnline ? "default" : "destructive",
    });
  };

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
          <Badge variant={isOnline ? "default" : "outline"} className={`px-3 py-1.5 ${isOnline ? "bg-green-500 hover:bg-green-600" : ""}`}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <Button onClick={toggleOnlineStatus}>
            {isOnline ? "Go Offline" : "Go Online"}
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
          <Button variant="outline">View Details</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDashboard;
