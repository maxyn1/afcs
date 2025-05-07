import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Wallet as WalletIcon, Plus, CreditCard, QrCode } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Socket, io } from "socket.io-client";
import AuthService from "../services/authService";
import { useToast } from "../components/ui/use-toast";
import MpesaPayment from "../components/payments/MpesaPayment";
import QRPayment from "../components/payments/QRPayment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const Wallet = () => {
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopUpInput, setShowTopUpInput] = useState(false);
  const [showMpesaPayment, setShowMpesaPayment] = useState(false);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'qr'>('mpesa');
  const socketRef = useRef<Socket | null>(null);

  const loadWalletData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [balanceRes, transactionsRes] = await Promise.all([
        AuthService.getWalletBalance(),
        AuthService.getWalletTransactions()
      ]);
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
  }, [toast]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (!user) return;

    // Connect to WebSocket server
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true
    });

    // Authenticate socket connection
    socketRef.current.emit('authenticate', user.id);

    // Listen for balance updates
    socketRef.current.on('balanceUpdate', (data) => {
      setBalance(data.balance);
      toast({
        title: "Balance Updated",
        description: `${data.transaction.type === 'credit' ? 'Added' : 'Deducted'} KSH ${data.transaction.amount}`,
        variant: data.transaction.type === 'credit' ? 'default' : 'destructive'
      });
      // Refresh transactions list
      loadWalletData();
    });

    // Listen for payment updates
    socketRef.current.on('paymentUpdate', (data) => {
      if (data.success) {
        setBalance(data.balance);
        toast({
          title: "Payment Successful",
          description: `KSH ${data.transaction.amount} has been added to your wallet`,
          variant: "default"
        });
        // Close payment dialogs
        setShowMpesaPayment(false);
        setShowQRPayment(false);
        setTopUpAmount("");
        // Refresh transaction history
        loadWalletData();
      } else {
        toast({
          title: "Payment Failed",
          description: data.error || "Your payment could not be processed",
          variant: "destructive"
        });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [toast, loadWalletData]); // Added missing dependencies

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const handleTopUpClick = () => {
    setShowTopUpInput(true);
  };

  const handleProceedToPayment = () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0"
      });
      return;
    }
    setShowTopUpInput(false);
    if (paymentMethod === 'mpesa') {
      setShowMpesaPayment(true);
    } else {
      setShowQRPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowMpesaPayment(false);
    setShowQRPayment(false);
    setTopUpAmount("");
    loadWalletData();
    toast({
      title: "Success",
      description: paymentMethod === 'mpesa' 
        ? "Payment initiated successfully. Please check your phone to complete the M-Pesa transaction"
        : "QR code payment completed successfully"
    });
  };

  const handlePaymentCancel = () => {
    setShowMpesaPayment(false);
    setShowQRPayment(false);
    setTopUpAmount("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              <p className="text-muted-foreground mt-2">Last updated today at {new Date().toLocaleTimeString()}</p>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Button className="flex items-center gap-2" onClick={handleTopUpClick}>
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

      <Dialog open={showTopUpInput} onOpenChange={setShowTopUpInput}>
        <DialogContent>
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Top Up Wallet</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="mpesa" onValueChange={(value) => setPaymentMethod(value as 'mpesa' | 'qr')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
                <TabsTrigger value="qr">QR Code</TabsTrigger>
              </TabsList>

              <TabsContent value="mpesa" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (KSH)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Enter amount"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="qr" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-amount">Amount (KSH)</Label>
                  <Input
                    id="qr-amount"
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Enter amount"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTopUpInput(false)}>
                Cancel
              </Button>
              <Button onClick={handleProceedToPayment}>
                Proceed to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMpesaPayment && !isNaN(parseFloat(topUpAmount)) && parseFloat(topUpAmount) > 0} onOpenChange={setShowMpesaPayment}>
        <DialogContent>
          <MpesaPayment 
            amount={parseFloat(topUpAmount)} 
            onSuccess={handlePaymentSuccess} 
            onCancel={handlePaymentCancel} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showQRPayment && !isNaN(parseFloat(topUpAmount)) && parseFloat(topUpAmount) > 0} onOpenChange={setShowQRPayment}>
        <DialogContent>
          <QRPayment
            amount={parseFloat(topUpAmount)}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
