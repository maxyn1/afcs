
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Plus, CreditCard } from "lucide-react";

const Wallet = () => {
  const mockBalance = 5250.75;

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
              <div className="text-4xl font-bold">KSH {mockBalance.toFixed(2)}</div>
              <p className="text-muted-foreground mt-2">Last updated today at 10:30 AM</p>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Button className="flex items-center gap-2">
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
