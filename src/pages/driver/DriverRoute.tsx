import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import driverService, { Route } from "@/services/driverService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Clock, Calendar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DriverRoutes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeRouteId, setActiveRouteId] = useState<number | null>(null);

  const { data: routes, isLoading } = useQuery({
    queryKey: ["driverRoutes"],
    queryFn: driverService.getRoutes,
  });

  const { data: activeRoute } = useQuery({
    queryKey: ["activeRoute"],
    queryFn: driverService.getActiveRoute,
  });

  const startRouteMutation = useMutation({
    mutationFn: (routeId: number) => driverService.startRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverRoutes"] });
      queryClient.invalidateQueries({ queryKey: ["activeRoute"] });
      toast({
        title: "Route started",
        description: "You have successfully started the route",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start route. Please try again.",
        variant: "destructive",
      });
    },
  });

  const endRouteMutation = useMutation({
    mutationFn: (routeId: number) => driverService.endRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverRoutes"] });
      queryClient.invalidateQueries({ queryKey: ["activeRoute"] });
      toast({
        title: "Route ended",
        description: "You have successfully ended the route",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end route. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartRoute = (routeId: number) => {
    startRouteMutation.mutate(routeId);
  };

  const handleEndRoute = (routeId: number) => {
    endRouteMutation.mutate(routeId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Routes</h1>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Routes</h1>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {routes?.length || 0} Routes Available
        </Badge>
      </div>

      {activeRoute && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default">Active Route</Badge>
            </CardTitle>
            <CardDescription>
              This is your currently active route
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">{activeRoute.name}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{activeRoute.start_point}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{activeRoute.end_point}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Card className="bg-muted/30 p-3">
                    <div className="text-sm text-muted-foreground">Distance</div>
                    <div className="font-bold">{activeRoute.distance} km</div>
                  </Card>
                  <Card className="bg-muted/30 p-3">
                    <div className="text-sm text-muted-foreground">Est. Time</div>
                    <div className="font-bold">{activeRoute.duration} min</div>
                  </Card>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => handleEndRoute(activeRoute.id)}
                >
                  End Route
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Routes</CardTitle>
          <CardDescription>
            Routes assigned to you by your SACCO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Name</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes?.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">
                    <div>{route.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {route.start_point} - {route.end_point}
                    </div>
                  </TableCell>
                  <TableCell>{route.stops} stops</TableCell>
                  <TableCell>{route.distance} km</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{route.schedule_days}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{route.schedule_hours}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activeRouteId === route.id}
                      onClick={() => handleStartRoute(route.id)}
                    >
                      {activeRouteId === route.id ? "Active" : "Start Route"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!routes || routes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No routes assigned. Contact your SACCO administrator.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverRoutes;