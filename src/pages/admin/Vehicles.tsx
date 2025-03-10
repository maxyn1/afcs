
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, Filter, PlusCircle, Search } from "lucide-react";

const Vehicles = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSacco, setFilterSacco] = useState("all");

  // Mock data
  const vehicles = [
    { id: "1", number: "KBZ 123A", sacco: "Metro Trans", route: "Nairobi - Mombasa", status: "active" },
    { id: "2", number: "KCY 456B", sacco: "City Hoppa", route: "Nairobi - Kisumu", status: "active" },
    { id: "3", number: "KDE 789C", sacco: "Forward Travelers", route: "Nairobi - Nakuru", status: "inactive" },
    { id: "4", number: "KDG 321D", sacco: "Super Metro", route: "Nairobi - Thika", status: "active" },
    { id: "5", number: "KEF 654E", sacco: "Embassava", route: "Nairobi - Machakos", status: "active" }
  ];

  const saccos = [
    "Metro Trans", 
    "City Hoppa", 
    "Forward Travelers", 
    "Super Metro", 
    "Embassava"
  ];

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          vehicle.sacco.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          vehicle.route.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSacco = filterSacco === "all" || vehicle.sacco === filterSacco;
    
    return matchesSearch && matchesSacco;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Vehicle Management</h1>
        <Button className="gap-2">
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
                  {saccos.map((sacco) => (
                    <SelectItem key={sacco} value={sacco}>
                      {sacco}
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
              filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="grid grid-cols-12 gap-2 p-4 border-t items-center">
                  <div className="col-span-2 font-medium">{vehicle.number}</div>
                  <div className="col-span-3">{vehicle.sacco}</div>
                  <div className="col-span-3">{vehicle.route}</div>
                  <div className="col-span-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vehicle.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No vehicles found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Vehicles;
