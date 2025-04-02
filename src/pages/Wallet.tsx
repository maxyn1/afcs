import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Plus, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import AuthService from "@/services/authService";
import { useToast } from "@/components/ui/use-toast";

const Wallet = () => {
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      const [balanceRes, transactionsRes] = await Promise.all([
        AuthService.getWalletBalance(),
        AuthService.getWalletTransactions()
      ]);
      // Ensure balance is a number
      const numBalance = Number(balanceRes.data.balance) || 0;
      setBalance(numBalance);
      setTransactions(transactionsRes);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load wallet data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async (amount: number) => {
    try {
      await AuthService.topUpWallet(amount);
      loadWalletData(); // Refresh data
      toast({
        title: "Success",
        description: "Wallet topped up successfully"
      });
    } catch (error) {
      console.error('Top up error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to top up wallet"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Your Wallet</h1>
      <p className="text-muted-foreground">Manage your balance and payment methods</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              Available Balance
            </CardTitle>
            <CardDescription>Your current wallet balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-6">
              <div className="text-4xl font-bold">
                KSH {typeof balance === 'number' ? balance.toFixed(2) : '0.00'}
              </div>
              <p className="text-muted-foreground mt-2">Last updated today at 10:30 AM</p>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Button className="flex items-center gap-2" onClick={() => handleTopUp(1000)}>
                  <Plus size={16} /> Add Money
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  View Transaction History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common wallet operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Payment Methods
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <WalletIcon className="mr-2 h-4 w-4" />
              Check Balance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
