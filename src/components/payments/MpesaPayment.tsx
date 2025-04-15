import { useState } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface MpesaPaymentProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const MpesaPayment = ({ amount, onSuccess, onCancel }: MpesaPaymentProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (phone: string) => {
    const regex = /^(254|0)?7\d{8}$/;
    return regex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number."
      });
      return;
    }
    setIsLoading(true);

    try {
      const formattedPhone = phoneNumber.startsWith("0") 
        ? `254${phoneNumber.substring(1)}` 
        : phoneNumber;

      const response = await api.post('/users/wallet/topup', {
        amount,
        payment_method: "mpesa",
        phoneNumber: formattedPhone
      });

      if (response.data?.checkoutRequestId) {
        toast({
          title: "Payment Initiated",
          description: "Please check your phone to complete the M-Pesa payment"
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate M-Pesa payment"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium">M-Pesa Payment</h3>
        <p className="text-sm text-muted-foreground">
          You will receive an STK push on your phone
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. 0712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="text"
            value={`KSH ${amount.toFixed(2)}`}
            readOnly
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Pay with M-Pesa"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MpesaPayment;
