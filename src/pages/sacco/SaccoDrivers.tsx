
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import saccoAdminService, { Driver } from "@/services/saccoAdminService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Search, X, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SaccoDrivers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isNewDriverOpen, setIsNewDriverOpen] = useState(false);
  const [newDriverData, setNewDriverData] = useState({
    name: "",
    email: "",
    phone: "",
    license_number: "",
  });
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['saccoDrivers', page, limit],
    queryFn: () => saccoAdminService.getDrivers(),
  });

  const createDriverMutation = useMutation({
    mutationFn: (driverData: any) => saccoAdminService.createDriver(driverData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saccoDrivers'] });
      toast({
        title: "Driver created",
        description: "The driver has been registered successfully.",
      });
      setIsNewDriverOpen(false);
      setNewDriverData({
        name: "",
        email: "",
        phone: "",
        license_number: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNewDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDriverMutation.mutate(newDriverData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDriverData((prev) => ({ ...prev, [name]: value }));
  };

  const drivers = data?.drivers || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

  const filteredDrivers = drivers.filter((driver: Driver) => 
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone.includes(searchQuery)
  );

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "suspended":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Drivers Management</h1>
        <Dialog open={isNewDriverOpen} onOpenChange={setIsNewDriverOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Register New Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Driver</DialogTitle>
              <DialogDescription>
                Fill out the form below to register a new driver to your SACCO.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleNewDriverSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={newDriverData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="johndoe@example.com"
                    value={newDriverData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+254 712 345 678"
                    value={newDriverData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    placeholder="DL12345678"
                    value={newDriverData.license_number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewDriverOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createDriverMutation.isPending}>
                  {createDriverMutation.isPending ? "Creating..." : "Register Driver"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Management</CardTitle>
          <CardDescription>
            View and manage all drivers registered to your SACCO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-10 bg-muted/50 rounded animate-pulse w-full"></div>
              <div className="h-10 bg-muted/50 rounded animate-pulse w-full"></div>
              <div className="h-10 bg-muted/50 rounded animate-pulse w-full"></div>
            </div>
          ) : filteredDrivers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver: Driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>{driver.email}</TableCell>
                      <TableCell>{driver.license_number}</TableCell>
                      <TableCell>
                        {driver.vehicle_id ? `#${driver.vehicle_id}` : "Not Assigned"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(driver.status)}>
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Assign Vehicle
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No drivers found matching your search criteria
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={page === i + 1}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(prev => prev < totalPages ? prev + 1 : prev)}
                      disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaccoDrivers;
