import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Bus, History, ArrowRight } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-primary text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available Balance</p>
                <h2 className="text-3xl font-bold">KSH 2,500.00</h2>
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
                <Bus size={20} />
                Available Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { route: "Nairobi - Mombasa", fare: 1000 },
                  { route: "Nairobi - Kisumu", fare: 1200 },
                  { route: "Nairobi - Nakuru", fare: 500 }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Bus className="text-primary" size={20} />
                      <div>
                        <p className="font-medium">{item.route}</p>
                        <p className="text-sm text-gray-500">Available Now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">KSH {item.fare}</p>
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

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