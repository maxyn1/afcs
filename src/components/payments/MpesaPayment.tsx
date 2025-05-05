import { useState } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface MpesaPaymentProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const MpesaPayment = ({ amount, onSuccess, onCancel }: MpesaPaymentProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumberValid, setPhoneNumberValid] = useState(false);

  const validatePhoneNumber = (phone: string) => {
    const regex = /^(254|0)?7\d{8}$/;
    return regex.test(phone);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    setPhoneNumberValid(validatePhoneNumber(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberValid) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number"
      });
      return;
    }
    setIsLoading(true);

    try {
      const formattedPhone = phoneNumber.startsWith("0") 
        ? `254${phoneNumber.substring(1)}` 
        : phoneNumber;

      const response = await api.post('/wallet/topup', {
        amount,
        payment_method: "mpesa",
        phoneNumber: formattedPhone
      });

      if (response.data?.checkoutRequestId) {
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
    <>
      <DialogHeader>
        <DialogTitle>M-Pesa Payment</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g. 0712345678"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter the M-Pesa number you want to use for payment
            </p>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="w-full p-2 bg-muted rounded-md">
              <p className="text-lg font-semibold">KSH {isNaN(amount) ? "0.00" : amount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isNaN(amount) || amount <= 0 || !phoneNumberValid}>
            {isLoading ? "Processing..." : "Pay Now"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default MpesaPayment;
