
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, PlusCircle, Search } from "lucide-react";

const Saccos = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const saccos = [
    { 
      id: "1", 
      name: "Metro Trans SACCO", 
      vehicles: 45, 
      routes: 8, 
      contact: "John Doe", 
      phone: "+254 712 345 678", 
      status: "active" 
    },
    { 
      id: "2", 
      name: "City Hoppa SACCO", 
      vehicles: 38, 
      routes: 6, 
      contact: "Jane Smith", 
      phone: "+254 723 456 789", 
      status: "active" 
    },
    { 
      id: "3", 
      name: "Forward Travelers SACCO", 
      vehicles: 22, 
      routes: 4, 
      contact: "Alex Johnson", 
      phone: "+254 734 567 890", 
      status: "inactive" 
    },
    { 
      id: "4", 
      name: "Super Metro SACCO", 
      vehicles: 65, 
      routes: 12, 
      contact: "Peter Kamau", 
      phone: "+254 745 678 901", 
      status: "active" 
    },
    { 
      id: "5", 
      name: "Embassava SACCO", 
      vehicles: 33, 
      routes: 5, 
      contact: "Mary Wanjiku", 
      phone: "+254 756 789 012", 
      status: "active" 
    }
  ];

  const filteredSaccos = saccos.filter(sacco => 
    sacco.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sacco.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">SACCO Management</h1>
        <Button className="gap-2">
          <PlusCircle size={18} />
          Register New SACCO
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={20} />
            Registered SACCOs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search SACCOs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-2 p-4 font-medium bg-muted/50">
              <div className="col-span-3">SACCO Name</div>
              <div className="col-span-1">Vehicles</div>
              <div className="col-span-1">Routes</div>
              <div className="col-span-2">Contact Person</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Actions</div>
            </div>
            
            {filteredSaccos.length > 0 ? (
              filteredSaccos.map((sacco) => (
                <div key={sacco.id} className="grid grid-cols-12 gap-2 p-4 border-t items-center">
                  <div className="col-span-3 font-medium">{sacco.name}</div>
                  <div className="col-span-1">{sacco.vehicles}</div>
                  <div className="col-span-1">{sacco.routes}</div>
                  <div className="col-span-2">{sacco.contact}</div>
                  <div className="col-span-2">{sacco.phone}</div>
                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sacco.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sacco.status}
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
                No SACCOs found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Saccos;
