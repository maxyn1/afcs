import { useState, useEffect } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, QrCode } from "lucide-react";
import { AxiosError } from "axios";

interface QRPaymentProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const QRPayment = ({ amount, onSuccess, onCancel }: QRPaymentProps) => {
  const [qrCode, setQRCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const generateQRCode = async () => {
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0"
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/wallet/qr-generate', { 
        amount: Math.round(amount)
      });
      
      if (response.data?.success && response.data?.qrCode) {
        setQRCode(response.data.qrCode);
        setReference(response.data.reference);
        startPolling(response.data.reference);
      } else {
        throw new Error(response.data?.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      const errorMessage = error instanceof AxiosError 
        ? error.response?.data?.message || error.message
        : error instanceof Error 
          ? error.message 
          : "Failed to generate QR code";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (ref: string) => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    const interval = setInterval(async () => {
      try {
        const statusRes = await api.get(`/wallet/qr-status/${ref}`);
        if (statusRes.data?.status === 'completed') {
          clearInterval(interval);
          onSuccess();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    setPollInterval(interval);

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
    }, 300000);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>M-Pesa QR Payment</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Amount to Pay</Label>
          <div className="w-full p-2 bg-muted rounded-md">
            <p className="text-lg font-semibold">KSH {amount.toFixed(2)}</p>
          </div>
        </div>

        {!qrCode && (
          <Button 
            className="w-full" 
            onClick={generateQRCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <QrCode className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Generating QR Code..." : "Generate QR Code"}
          </Button>
        )}

        {qrCode && (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <img 
                src={`data:image/png;base64,${qrCode}`}
                alt="Payment QR Code"
                className="w-64 h-64"
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Scan this QR code with your M-Pesa app to complete payment
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
};

export default QRPayment;
