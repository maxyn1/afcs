import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  CreditCard, 
  Bus, 
  Building2
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { adminService } from "@/services/adminService";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    userStats: { total: 0, percentChange: '0%', trend: 'up' },
    revenueStats: { formattedTotal: 'KSH 0', percentChange: '0%', trend: 'up' },
    vehicleStats: { total: 0, percentChange: '0%', trend: 'up' },
    saccoStats: { total: 0, percentChange: '0%', trend: 'up' },
    recentTransactions: [],
    activeSaccos: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  const dashboardStats = [
    {
      title: "Total Users",
      value: stats.userStats.total,
      icon: <Users className="h-5 w-5 text-blue-500" />,
      change: stats.userStats.percentChange,
      trend: stats.userStats.trend
    },
    {
      title: "Total Revenue",
      value: stats.revenueStats.formattedTotal,
      icon: <CreditCard className="h-5 w-5 text-green-500" />,
      change: stats.revenueStats.percentChange,
      trend: stats.revenueStats.trend
    },
    {
      title: "Active Vehicles",
      value: stats.vehicleStats.total,
      icon: <Bus className="h-5 w-5 text-yellow-500" />,
      change: stats.vehicleStats.percentChange,
      trend: stats.vehicleStats.trend
    },
    {
      title: "Registered SACCOs",
      value: stats.saccoStats.total,
      icon: <Building2 className="h-5 w-5 text-purple-500" />,
      change: stats.saccoStats.percentChange,
      trend: stats.saccoStats.trend
    }
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, i) => (
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
              {stats.recentTransactions.map((transaction, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">Transaction #{transaction.id}</p>
                    <p className="text-sm text-gray-500">User ID: {transaction.userId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">KSH {transaction.amount}</p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

        <Card>
          <CardHeader>
            <CardTitle>Active SACCOs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.activeSaccos.map((sacco, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                      {sacco.name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{sacco.name} SACCO</p>
                      <p className="text-sm text-gray-500">{sacco.vehicleCount} vehicles</p>
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
