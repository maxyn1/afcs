import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Bus, History, ArrowRight, Building2, Car } from "lucide-react";
import { useState, useEffect } from "react";
import AuthService from "@/services/authService";

interface Vehicle {
  id: string;
  number: string;
  sacco: string;
}

interface Route {
  route: string;
  fare: number;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [saccos, setSaccos] = useState<{ id: string; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [balance, setBalance] = useState(0);
  const [selectedSacco, setSelectedSacco] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<string>("");

  useEffect(() => {

   const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }




    const fetchData = async () => {
        try {
          const [saccosRes, routesRes, balanceRes] = await Promise.all([
            AuthService.getSaccos(),
            AuthService.getRoutes(),
            AuthService.getWalletBalance()
          ]);
          
          setSaccos(saccosRes.data);
          setRoutes(routesRes.data);
          setBalance(balanceRes.data.balance);
        } catch (error) {
          console.error('Error loading data:', error);
          // If we get an unauthorized error, redirect to login
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
          }
        }
      };
      fetchData();
    };

       checkAuth();
  }, [navigate]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSaccoChange = async (saccoId: string) => {
    setSelectedSacco(saccoId);
    try {
      const res = await AuthService.getVehicles(saccoId);
      setVehicles(res.data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleTopUp = async (amount: number) => {
    try {
      await AuthService.topUpWallet(amount);
      const balanceRes = await AuthService.getWalletBalance();
      setBalance(balanceRes.data.balance);
    } catch (error) {
      console.error('Top-up failed:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedSacco || !selectedVehicle || !selectedRoute) return;
    
    try {
      const selectedRouteFare = routes.find(r => r.route === selectedRoute)?.fare || 0;
      await AuthService.makePayment({
        saccoId: selectedSacco,
        vehicleId: selectedVehicle,
        route: selectedRoute,
        amount: selectedRouteFare
      });
      
      // Refresh balance after payment
      const balanceRes = await AuthService.getWalletBalance();
      setBalance(balanceRes.data.balance);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-primary text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available Balance</p>
                <h2 className="text-3xl font-bold">KSH {balance.toFixed(2)}</h2>
              </div>
              <Wallet size={32} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet size={20} />
                Top Up Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Enter amount (KSH)"
                  className="text-lg"
                />
                <Button className="w-full" onClick={() => {}}>
                  Top Up via M-PESA
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 size={20} />
                Select SACCO & Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Select onValueChange={setSelectedSacco}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select SACCO" />
                  </SelectTrigger>
                  <SelectContent>
                    {saccos.map((sacco) => (
                      <SelectItem key={sacco.id} value={sacco.id}>
                        {sacco.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles
                      .filter((v) => v.sacco === selectedSacco)
                      .map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.number}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bus size={20} />
              Available Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routes.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer"
                  onClick={() => setSelectedRoute(item.route)}
                >
                  <div className="flex items-center gap-3">
                    <Bus className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">{item.route}</p>
                      <p className="text-sm text-gray-500">
                        {selectedSacco && selectedVehicle
                          ? `Vehicle: ${
                              vehicles.find((v) => v.id === selectedVehicle)?.number
                            }`
                          : "Select SACCO and Vehicle"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">KSH {item.fare}</p>
                    <Button
                      size="sm"
                      disabled={!selectedSacco || !selectedVehicle}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePayment();
                      }}
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History size={20} />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">Nairobi - Mombasa</p>
                    <p className="text-sm text-gray-500">Today, 2:30 PM</p>
                  </div>
                  <p className="font-medium text-destructive">-KSH 1,000</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;