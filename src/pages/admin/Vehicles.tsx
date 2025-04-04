import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, Filter, PlusCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import vehicleService, { Vehicle } from "@/services/vehicleService";
import { VehicleModal } from "@/components/vehicles/VehicleModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSacco, setFilterSacco] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>();
  const [deleteVehicleId, setDeleteVehicleId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];
  const { toast } = useToast();

  // Fetch vehicles
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setIsLoading(true);
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUpdate = async (data: Partial<Vehicle>) => {
    try {
      if (!data.sacco_id || !data.registration_number || !data.capacity) {
        throw new Error("Please fill in all required fields");
      }

      if (selectedVehicle) {
        const updatedData = {
          ...data,
          id: selectedVehicle.id
        };
        await vehicleService.updateVehicle(selectedVehicle.id, updatedData);
        toast({ title: "Success", description: "Vehicle updated successfully" });
      } else {
        await vehicleService.createVehicle(data);
        toast({ title: "Success", description: "Vehicle created successfully" });
      }
      
      await loadVehicles();
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await vehicleService.deleteVehicle(id);
      toast({ title: "Success", description: "Vehicle deleted successfully" });
      loadVehicles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vehicle",
        variant: "destructive"
      });
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vehicle.sacco_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSacco = filterSacco === "all" || vehicle.sacco_id.toString() === filterSacco;
    return matchesSearch && matchesSacco;
  });

  // Replace the existing uniqueSaccos calculation with this:
  const uniqueSaccos = Array.from(
    new Map(
      vehicles
        .filter(v => v.sacco_id && v.sacco_name)
        .map(v => [v.sacco_id, { id: v.sacco_id, name: v.sacco_name }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Pagination logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredVehicles.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSacco]);

  const renderPaginationButtons = () => {
    const range = (start: number, end: number) => 
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const rangeWithDots = () => {
      const delta = 2;
      const pages = range(1, totalPages);
      const result: (number | string)[] = [];

      for (let i = 1; i <= totalPages; i++) {
        if (
          i === 1 || 
          i === totalPages ||
          (i >= currentPage - delta && i <= currentPage + delta)
        ) {
          result.push(i);
        } else if (i === currentPage - delta - 1 || i === currentPage + delta + 1) {
          result.push('...');
        }
      }

      return result;
    };

    return rangeWithDots().map((page, index) => {
      if (page === '...') {
        return (
          <span
            key={`ellipsis-${index}`}
            className="mx-1 flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
          >
            ...
          </span>
        );
      }

      const pageNumber = page as number;
      return (
        <Button
          key={`page-${pageNumber}`}
          variant={currentPage === pageNumber ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 mx-1"
          onClick={() => setCurrentPage(pageNumber)}
        >
          {pageNumber}
        </Button>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Vehicle Management</h1>
        <Button className="gap-2" onClick={() => {
          setSelectedVehicle(undefined);
          setIsModalOpen(true);
        }}>
          <PlusCircle size={18} />
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus size={20} />
            Registered Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search vehicles..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64 flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <Select value={filterSacco} onValueChange={setFilterSacco}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by SACCO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SACCOs</SelectItem>
                  {uniqueSaccos.map((sacco) => (
                    <SelectItem key={sacco.id} value={sacco.id.toString()}>
                      {sacco.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-2 p-4 font-medium bg-muted/50">
              <div className="col-span-2">Vehicle No.</div>
              <div className="col-span-3">SACCO</div>
              <div className="col-span-3">Route</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Actions</div>
            </div>
            
            {filteredVehicles.length > 0 ? (
              <>
                {currentItems.map((vehicle) => (
                  <div key={vehicle.id} className="grid grid-cols-12 gap-2 p-4 border-t items-center">
                    <div className="col-span-2 font-medium">{vehicle.registration_number}</div>
                    <div className="col-span-3">{vehicle.sacco_name}</div>
                    <div className="col-span-3">{vehicle.route || 'No routes assigned'}</div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        vehicle.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : vehicle.status === 'maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.status}
                      </span>
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedVehicle(vehicle);
                        setIsModalOpen(true);
                      }}>Edit</Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteVehicleId(vehicle.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="p-4 border-t">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Rows per page:</span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage} />
                        </SelectTrigger>
                        <SelectContent>
                          {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>
                        {startIndex + 1}-{Math.min(endIndex, filteredVehicles.length)} of{" "}
                        {filteredVehicles.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center">
                        {renderPaginationButtons()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No vehicles found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <VehicleModal 
        vehicle={selectedVehicle}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateUpdate}
        saccos={uniqueSaccos} // This will now have unique SACCOs
      />

      <AlertDialog open={!!deleteVehicleId} onOpenChange={() => setDeleteVehicleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteVehicleId && handleDelete(deleteVehicleId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;
