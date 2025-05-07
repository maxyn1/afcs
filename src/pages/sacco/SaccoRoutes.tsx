import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import saccoAdminService, { Route } from "@/services/saccoAdminService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SaccoRoutes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewRouteOpen, setIsNewRouteOpen] = useState(false);
  const [isEditRouteOpen, setIsEditRouteOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [newRouteData, setNewRouteData] = useState({
    name: "",
    start_point: "",
    end_point: "",
    distance: "0",
    fare: "0",
  });
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['saccoRoutes'],
    queryFn: saccoAdminService.getRoutes,
  });

  const createRouteMutation = useMutation({
    mutationFn: (routeData: Partial<Route>) => saccoAdminService.createRoute(routeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saccoRoutes'] });
      toast({
        title: "Route created",
        description: "The route has been created successfully.",
      });
      setIsNewRouteOpen(false);
      setNewRouteData({
        name: "",
        start_point: "",
        end_point: "",
        distance: "0",
        fare: "0",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create route. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Route> }) => 
      saccoAdminService.updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saccoRoutes'] });
      toast({
        title: "Route updated",
        description: "The route has been updated successfully.",
      });
      setIsEditRouteOpen(false);
      setSelectedRoute(null);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update route. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNewRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRouteMutation.mutate({
      ...newRouteData,
      distance: parseFloat(newRouteData.distance),
      fare: parseFloat(newRouteData.fare),
    });
  };

  const handleEditRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;

    const updatedData = {
      ...newRouteData,
      distance: parseFloat(newRouteData.distance),
      fare: parseFloat(newRouteData.fare),
    };

    updateRouteMutation.mutate({ 
      id: selectedRoute.id, 
      data: updatedData 
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRouteData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (route: Route) => {
    setSelectedRoute(route);
    setNewRouteData({
      name: route.name || '',
      start_point: route.start_point || '',
      end_point: route.end_point || '',
      distance: (route.distance ?? 0).toString(),
      fare: (route.fare ?? 0).toString(),
    });
    setIsEditRouteOpen(true);
  };

  const handleStatusToggle = (route: Route) => {
    updateRouteMutation.mutate({
      id: route.id,
      data: {
        ...route,
        status: route.status === 'active' ? 'inactive' : 'active'
      }
    });
  };

  const routes = data || [];

  const filteredRoutes = routes.filter((route: Route) => 
    (route.name?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
    (route.start_point?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
    (route.end_point?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Routes Management</h1>
        <Dialog open={isNewRouteOpen} onOpenChange={setIsNewRouteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Route
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Route</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new route for your SACCO.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleNewRouteSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Route Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="CBD - Westlands"
                    value={newRouteData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start_point">Start Point</Label>
                  <Input
                    id="start_point"
                    name="start_point"
                    placeholder="CBD Terminal"
                    value={newRouteData.start_point}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_point">End Point</Label>
                  <Input
                    id="end_point"
                    name="end_point"
                    placeholder="Westlands Mall"
                    value={newRouteData.end_point}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="distance">Distance (km)</Label>
                    <Input
                      id="distance"
                      name="distance"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="5.5"
                      value={newRouteData.distance}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fare">Fare (KES)</Label>
                    <Input
                      id="fare"
                      name="fare"
                      type="number"
                      min="0"
                      step="10"
                      placeholder="100"
                      value={newRouteData.fare}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewRouteOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createRouteMutation.isPending}>
                  {createRouteMutation.isPending ? "Creating..." : "Create Route"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditRouteOpen} onOpenChange={setIsEditRouteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Route</DialogTitle>
              <DialogDescription>
                Update the route details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditRouteSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Route Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    placeholder="CBD - Westlands"
                    value={newRouteData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-start_point">Start Point</Label>
                  <Input
                    id="edit-start_point"
                    name="start_point"
                    placeholder="CBD Terminal"
                    value={newRouteData.start_point}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-end_point">End Point</Label>
                  <Input
                    id="edit-end_point"
                    name="end_point"
                    placeholder="Westlands Mall"
                    value={newRouteData.end_point}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-distance">Distance (km)</Label>
                    <Input
                      id="edit-distance"
                      name="distance"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="5.5"
                      value={newRouteData.distance}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-fare">Fare (KES)</Label>
                    <Input
                      id="edit-fare"
                      name="fare"
                      type="number"
                      min="0"
                      step="10"
                      placeholder="100"
                      value={newRouteData.fare}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditRouteOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateRouteMutation.isPending}>
                  {updateRouteMutation.isPending ? "Updating..." : "Update Route"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routes Management</CardTitle>
          <CardDescription>
            View and manage all routes operated by your SACCO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search routes..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-24 bg-muted/50 rounded animate-pulse w-full"></div>
              <div className="h-24 bg-muted/50 rounded animate-pulse w-full"></div>
            </div>
          ) : filteredRoutes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRoutes.map((route: Route) => (
                <Card key={route.id} className="border">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      <Badge variant={route.status === 'active' ? 'secondary' : 'default'}>
                        {route.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                     <span className="text-lg font-medium text-blue-600" > {route.distance} km </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm text-muted-foreground">Start Point:</div>
                        <div className="col-span-2 font-medium">{route.start_point}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm text-muted-foreground">End Point:</div>
                        <div className="col-span-2 font-medium">{route.end_point}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm text-muted-foreground">Fare:</div>
                        <div className="col-span-2 font-medium">KES {route.fare}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm text-muted-foreground">Vehicles:</div>
                        <div className="col-span-2 font-medium">{route.assigned_vehicles}</div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(route)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={route.status === 'active' ? "text-amber-500 border-amber-500" : "text-green-500 border-green-500"}
                        onClick={() => handleStatusToggle(route)}
                      >
                        {route.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No routes found matching your search criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaccoRoutes;
