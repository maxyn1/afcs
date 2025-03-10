
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  CreditCard, 
  Bus, 
  Building2,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();

  // Mock stats data - In a real app, this would come from your backend
  const stats = [
    {
      title: "Total Users",
      value: "12,345",
      icon: <Users className="h-5 w-5 text-blue-500" />,
      change: "+12%",
      trend: "up"
    },
    {
      title: "Total Revenue",
      value: "KSH 1.2M",
      icon: <CreditCard className="h-5 w-5 text-green-500" />,
      change: "+8%",
      trend: "up"
    },
    {
      title: "Active Vehicles",
      value: "234",
      icon: <Bus className="h-5 w-5 text-yellow-500" />,
      change: "-3%",
      trend: "down"
    },
    {
      title: "Registered SACCOs",
      value: "42",
      icon: <Building2 className="h-5 w-5 text-purple-500" />,
      change: "+5%",
      trend: "up"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-gray-100 p-2 rounded-full">
                  {stat.icon}
                </div>
                {stat.trend === "up" ? (
                  <div className="flex items-center text-green-500 text-sm">
                    {stat.change} <ArrowUpRight className="ml-1 h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center text-red-500 text-sm">
                    {stat.change} <ArrowDownRight className="ml-1 h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">Transaction #{1000 + i}</p>
                    <p className="text-sm text-gray-500">User ID: {100 + i}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">KSH {(Math.random() * 1000).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Today, {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active SACCOs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Metro Trans", "City Hoppa", "Forward Travelers", "Embassava", "Super Metro"].map((sacco, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                      {sacco[0]}
                    </div>
                    <div>
                      <p className="font-medium">{sacco} SACCO</p>
                      <p className="text-sm text-gray-500">{10 + Math.floor(Math.random() * 50)} vehicles</p>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Active
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
