import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import driverService, { Driver } from "@/services/driverService";
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
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, IdCard, Car } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DriverProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Driver>>({});
  const queryClient = useQueryClient();

  const { data: driver, isLoading, error, isError } = useQuery({
    queryKey: ['driverProfile'],
    queryFn: async () => {
      try {
        console.log('Fetching driver profile...');
        const response = await driverService.getProfile();
        console.log('Driver profile fetch successful:', response);
        return response;
      } catch (error) {
        console.error('Error fetching driver profile:', error);
        throw error;
      }
    },
    retry: 1
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Driver>) => {
      console.log('Updating driver profile with data:', data);
      const response = await driverService.updateProfile(data);
      console.log('Update response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('Profile update successful');
      queryClient.invalidateQueries({ queryKey: ['driverProfile'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setFormData({
        name: driver?.name,
        email: driver?.email,
        phone: driver?.phone,
      });
      setIsEditing(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Driver Profile</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">
              Error loading profile: {error?.message || 'Unknown error occurred'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Driver Profile</h1>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="h-5 bg-muted/50 rounded animate-pulse w-1/3"></div>
                <div className="h-5 bg-muted/50 rounded animate-pulse w-1/2"></div>
                <div className="h-5 bg-muted/50 rounded animate-pulse w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Driver Profile</h1>
        <Button onClick={handleEditToggle}>
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your profile information as registered with the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{driver?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{driver?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{driver?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">License:</span>
                    <span className="font-medium">{driver?.license_number}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SACCO Information</CardTitle>
            <CardDescription>Your associated SACCO details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">SACCO:</span>
                  <span className="font-medium">{driver?.sacco_name}</span>
                </div>
                <Badge variant="outline">{driver?.status}</Badge>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned Vehicle:</span>
                <span className="font-medium">
                  {driver?.vehicle_id ? `Vehicle #${driver?.vehicle_id}` : "Not assigned"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Your driving statistics and rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Trips</div>
                <div className="text-2xl font-bold">{driver?.trips_count || 0}</div>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Rating</div>
                <div className="text-2xl font-bold">{driver?.rating || 0}/5</div>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="text-2xl font-bold capitalize">{driver?.status}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverProfile;
