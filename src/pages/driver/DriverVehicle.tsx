import { useQuery } from "@tanstack/react-query";
import driverService from "@/services/driverService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Car, 
  Calendar, 
  Users, 
  AlertTriangle, 
  Check, 
  FileText, 
  BarChart3 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const DriverVehicle = () => {
  const queryClient = useQueryClient();
  
  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['driverVehicle'],
    queryFn: driverService.getVehicleInfo,
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: (status: 'active' | 'inactive') => driverService.updateStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverVehicle'] });
      toast({
        title: "Status updated",
        description: "Your vehicle status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update vehicle status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reportIssueMutation = useMutation({
    mutationFn: (issue: { type: string; description: string; priority: 'low' | 'medium' | 'high' }) => 
      driverService.reportIssue(issue),
    onSuccess: () => {
      toast({
        title: "Issue reported",
        description: "Your issue has been reported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Report failed",
        description: "Failed to report issue. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateStatus = (status: 'active' | 'inactive') => {
    updateStatusMutation.mutate(status);
  };

  const handleReportIssue = () => {
    // Simple example - in a real app you'd use a form
    reportIssueMutation.mutate({
      type: "Mechanical",
      description: "Vehicle needs maintenance",
      priority: "medium"
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Vehicle Details</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="h-10 bg-muted/50 rounded animate-pulse w-full"></div>
              <div className="h-20 bg-muted/50 rounded animate-pulse w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Vehicle Details</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-semibold">No Vehicle Assigned</h2>
              <p className="text-muted-foreground">
                You currently don't have a vehicle assigned to you. Please contact your SACCO administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vehicle Details</h1>
        <div className="flex gap-2">
          {vehicle.status === 'active' ? (
            <Button 
              variant="outline" 
              className="text-amber-500 border-amber-500 hover:bg-amber-50"
              onClick={() => handleUpdateStatus('inactive')}
              disabled={updateStatusMutation.isPending}
            >
              Go Offline
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="text-green-500 border-green-500 hover:bg-green-50"
              onClick={() => handleUpdateStatus('active')}
              disabled={updateStatusMutation.isPending}
            >
              Go Online
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={handleReportIssue}
            disabled={reportIssueMutation.isPending}
          >
            Report Issue
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
            <CardDescription>Details about your assigned vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">{vehicle.registration_number}</h3>
                  <p className="text-muted-foreground">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                </div>
                <Badge 
                  variant={vehicle.status === 'active' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {vehicle.status}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {vehicle.capacity} passengers
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Maintenance</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(vehicle.last_maintenance).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Insurance Expiry</p>
                  <p className="font-medium flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {new Date(vehicle.insurance_expiry).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Assigned Route</p>
                  <p className="font-medium flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {vehicle.route || 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Vehicle Stats
            </CardTitle>
            <CardDescription>Current performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Trips</div>
                <div className="text-2xl font-bold">{vehicle.trips_count || 0}</div>
              </div>
              
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Fuel Efficiency</div>
                <div className="text-2xl font-bold">{vehicle.fuel_efficiency || 'N/A'}</div>
              </div>
              
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Mileage</div>
                <div className="text-2xl font-bold">{vehicle.mileage || 0} km</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverVehicle;
