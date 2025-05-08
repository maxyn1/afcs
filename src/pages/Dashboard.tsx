import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Bus, History, ArrowRight, Building2, Car, AlertCircle, CreditCard, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import AuthService from "@/services/authService";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import { PassengerRoute, Vehicle, Transaction } from "@/types";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const navigate = useNavigate();
  
  // Data states
  const [saccos, setSaccos] = useState<{ id: string; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<PassengerRoute[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Selection states
  const [selectedSacco, setSelectedSacco] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [topUpAmount, setTopUpAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState("pay");

  // Derived values
  const selectedRouteFare = routes.find(r => r.route === selectedRoute)?.fare || 0;
  const selectedVehicleNumber = vehicles.find(v => v.id === selectedVehicle)?.number || "";
  const isReadyToPay = selectedSacco && selectedVehicle && selectedRoute;

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const user = AuthService.getCurrentUser();
        if (!user || !AuthService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        console.log('Fetching initial dashboard data...');
        
        // Fetch all initial data in parallel
        const [saccosRes, routesRes, balanceRes] = await Promise.all([
          AuthService.getSaccos(),
          AuthService.getRoutes(),
          AuthService.getWalletBalance()
        ]);
        
        console.log('Saccos response:', saccosRes.data);
        console.log('Routes response:', routesRes.data);
        console.log('Balance response:', balanceRes.data);
        
        setSaccos(saccosRes.data);
        interface BackendRoute {
          id: number;
          name: string;
          start_point: string;
          end_point: string;
          distance: number;
          fare: number;
          status: string;
          assigned_vehicles: number;
        }
        setRoutes(routesRes.data.map((r: BackendRoute) => ({ 
          id: r.id,
          route: r.name || `${r.start_point} - ${r.end_point}`,
          fare: r.fare 
        })));
        setBalance(Number(balanceRes.data.balance) || 0);
        
        // Mock transactions data (replace with actual API call)
        setTransactions([
          { id: "1", route: "Nairobi - Mombasa", amount: 1000, date: "Today, 2:30 PM" },
          { id: "2", route: "Nairobi - Nakuru", amount: 500, date: "Yesterday, 10:15 AM" },
          { id: "3", route: "Nairobi - Kisumu", amount: 1200, date: "May 3, 2025" }
        ]);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Failed to load dashboard data",
          description: "Please try refreshing the page",
          variant: "destructive"
        });
        
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          AuthService.logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const handleSaccoChange = async (saccoId: string) => {
    setSelectedSacco(saccoId);
    setSelectedVehicle(""); // Reset selected vehicle when SACCO changes
    try {
      setVehicles([]); // Clear vehicles while loading
      const res = await AuthService.getVehicles(saccoId);
      setVehicles(res.data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast({
        title: "Failed to load vehicles",
        description: "Please try selecting the SACCO again",
        variant: "destructive"
      });
      setVehicles([]);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to top up",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsTopUpLoading(true);
      const amount = parseFloat(topUpAmount);
      await AuthService.topUpWallet(amount);
      const balanceRes = await AuthService.getWalletBalance();
      setBalance(balanceRes.data.balance);
      setTopUpAmount("");
      
      toast({
        title: "Top-up successful",
        description: `KSH ${amount.toFixed(2)} added to your wallet`,
        variant: "default"
      });
    } catch (error) {
      console.error('Top-up failed:', error);
      toast({
        title: "Top-up failed",
        description: "There was an error processing your top-up",
        variant: "destructive"
      });
    } finally {
      setIsTopUpLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!isReadyToPay) {
      toast({
        title: "Cannot process payment",
        description: "Please select a SACCO, vehicle, and route",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsPaymentLoading(true);
      
      await AuthService.makePayment({
        saccoId: selectedSacco,
        vehicleId: selectedVehicle,
        route: selectedRoute,
        amount: selectedRouteFare
      });
      
      // Refresh balance after payment
      const balanceRes = await AuthService.getWalletBalance();
      setBalance(balanceRes.data.balance);
      
      // Add to transactions (in a real app, you'd fetch updated transactions)
      const newTransaction = {
        id: Date.now().toString(),
        route: selectedRoute,
        amount: selectedRouteFare,
        date: "Just now",
        vehicleNumber: selectedVehicleNumber
      };
      
      setTransactions([newTransaction, ...transactions]);
      
      // Reset selections
      setSelectedRoute("");
      setSelectedVehicle("");
      setSelectedSacco("");
      
      toast({
        title: "Payment successful",
        description: `KSH ${selectedRouteFare} paid for ${selectedRoute}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment",
        variant: "destructive"
      });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Balance Card */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transit Pay Dashboard</h1>
            <p className="text-gray-500">Pay for your rides easily and securely</p>
          </div>
          
          <Card className="bg-primary text-white w-full md:w-auto">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Wallet size={28} className="text-primary-foreground/90" />
                <div>
                  <p className="text-xs text-primary-foreground/80">Available Balance</p>
                  <h2 className="text-2xl font-bold">
                    KSH {typeof balance === 'number' ? balance.toFixed(2) : '0.00'}
                  </h2>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main tabs for different actions */}
        <Tabs defaultValue="pay" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="pay" className="flex items-center gap-2">
              <Bus size={16} />
              Pay for Ride
            </TabsTrigger>
            <TabsTrigger value="topup" className="flex items-center gap-2">
              <CreditCard size={16} />
              Top Up Wallet
            </TabsTrigger>
          </TabsList>
          
          {/* Pay for Ride Tab */}
          <TabsContent value="pay" className="space-y-4">
            {balance < 300 && (
              <Alert variant="default" className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Your balance is low. Consider topping up your wallet.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Route Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bus size={18} className="text-primary" />
                    Select Route
                  </CardTitle>
                  <CardDescription>Choose your destination</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={setSelectedRoute} value={selectedRoute}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.route}>
                          <div className="flex justify-between items-center w-full">
                            <span>{route.route}</span>
                            <Badge variant="outline">KSH {route.fare}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedRoute && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Selected fare:</span>
                        <span className="font-semibold text-primary">KSH {selectedRouteFare}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SACCO & Vehicle Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 size={18} className="text-primary" />
                    Select SACCO & Vehicle
                  </CardTitle>
                  <CardDescription>Choose your transport provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select onValueChange={handleSaccoChange} value={selectedSacco}>
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

                  <Select 
                    onValueChange={setSelectedVehicle}
                    value={selectedVehicle}
                    disabled={!selectedSacco}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedSacco ? "Select Vehicle" : "Select SACCO first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.number}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem key="no-vehicles" value="none" disabled>
                          {selectedSacco ? "No vehicles available" : "Select a SACCO first"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Payment Button */}
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="text-center md:text-left">
                    <h3 className="font-medium">Payment Summary</h3>
                    <p className="text-sm text-gray-500">
                      {isReadyToPay 
                        ? `${selectedRoute} - Vehicle ${selectedVehicleNumber}`
                        : "Complete your selection to proceed"}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {selectedRouteFare > 0 && (
                      <span className="text-lg font-bold">KSH {selectedRouteFare}</span>
                    )}
                    <Button 
                      size="lg"
                      disabled={!isReadyToPay || isPaymentLoading || selectedRouteFare > balance}
                      onClick={handlePayment}
                      className="min-w-[120px]"
                    >
                      {isPaymentLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Processing
                        </span>
                      ) : selectedRouteFare > balance ? (
                        <span className="flex items-center gap-2">
                          <AlertCircle size={16} />
                          Insufficient
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CreditCard size={16} />
                          Pay Now
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Top Up Tab */}
          <TabsContent value="topup">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  Top Up Your Wallet
                </CardTitle>
                <CardDescription>Add funds to your transit wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Enter amount in KSH"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      min="100"
                      className="text-lg"
                    />
                  </div>
                  <Button 
                    onClick={handleTopUp}
                    disabled={!topUpAmount || isTopUpLoading || parseFloat(topUpAmount) <= 0}
                    className="min-w-[120px]"
                  >
                    {isTopUpLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Processing
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus size={16} />
                        Add Funds
                      </span>
                    )}
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[500, 1000, 2000].map((amount) => (
                    <Button 
                      key={amount}
                      variant="outline"
                      onClick={() => setTopUpAmount(amount.toString())}
                      className="text-center"
                    >
                      KSH {amount}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <History size={18} className="text-primary" />
              Recent Transactions
            </CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border border-gray-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded">
                        <Bus size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.route}</p>
                        <p className="text-xs text-gray-500">{transaction.date}</p>
                        {transaction.vehicleNumber && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Vehicle: {transaction.vehicleNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="font-medium text-destructive">-KSH {transaction.amount}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <History className="mx-auto mb-2 h-10 w-10 opacity-20" />
                <p>No transactions yet</p> 
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;