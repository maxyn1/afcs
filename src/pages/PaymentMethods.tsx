
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Trash2, Check, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PaymentMethods = () => {
  const [paymentMethods] = useState([
    {
      id: "1",
      name: "M-Pesa",
      number: "254712345678",
      isDefault: true,
      type: "mobile"
    },
    {
      id: "2",
      name: "Debit Card",
      number: "**** **** **** 4321",
      isDefault: false,
      type: "card",
      expiryDate: "10/25"
    }
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Payment Methods</h1>
      <p className="text-muted-foreground">Manage your payment options</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Your Payment Methods</CardTitle>
              <CardDescription>Manage your saved payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map(method => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-medium flex items-center">
                        {method.name}
                        {method.isDefault && (
                          <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{method.number}</div>
                      {method.expiryDate && (
                        <div className="text-xs text-muted-foreground">Expires: {method.expiryDate}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {!method.isDefault && (
                      <>
                        <Button variant="ghost" size="icon">
                          <Check className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              <Button className="w-full mt-4" variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure your payment preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Default Payment Method</h3>
                <p className="text-sm text-muted-foreground">Choose which payment method to use by default</p>
                <Button variant="outline">Change Default Method</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
