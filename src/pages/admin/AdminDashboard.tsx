import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  CreditCard, 
  Bus, 
  Building2
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { dashboardService, DashboardStats, Transaction, Sacco } from "@/services/dashboardService";
import { logger } from "@/utils/logger";
import { StatCard } from "@/components/dashboard/StatCard";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeSaccos, setActiveSaccos] = useState<Sacco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        logger.info('Fetching dashboard data');
        
        const [statsData, transactions, saccos] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentTransactions(),
          dashboardService.getActiveSaccos()
        ]);

        logger.debug('Raw stats data:', {
          statsData: JSON.stringify(statsData, null, 2),
          transactions: transactions.length,
          saccos: saccos.length
        });

        // Get first items or use defaults
        const users = statsData.users[0] || { totalUsers: 0, userGrowth: '0' };
        const txns = statsData.transactions[0] || { totalRevenue: '0', revenueGrowth: '0' };
        const vehicles = statsData.vehicles[0] || { activeVehicles: 0, vehicleGrowth: '0' };
        const saccoStats = statsData.saccos[0] || { totalSaccos: 0, saccoGrowth: '0' };

        // Transform data with safe parsing
        const transformedStats = {
          totalUsers: Number(users.totalUsers) || 0,
          totalRevenue: Number(txns.totalRevenue) || 0,
          activeVehicles: Number(vehicles.activeVehicles) || 0,
          totalSaccos: Number(saccoStats.totalSaccos) || 0,
          userGrowth: Number(users.userGrowth) || 0,
          revenueGrowth: Number(txns.revenueGrowth) || 0,
          vehicleGrowth: Number(vehicles.vehicleGrowth) || 0,
          saccoGrowth: Number(saccoStats.saccoGrowth) || 0
        };

        logger.debug('Transformed stats:', {
          rawStats: { users, txns, vehicles, saccoStats },
          transformedStats,
          numbers: {
            totalUsers: Number(users.totalUsers),
            totalRevenue: Number(txns.totalRevenue)
          }
        });
        
        setStats(transformedStats);
        setRecentTransactions(transactions);
        setActiveSaccos(saccos);
      } catch (error) {
        logger.error('Error fetching dashboard data:', {
          error,
          message: error.message,
          response: error.response?.data
        });
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatsData = () => {
    if (!stats) return [];

    return [
      {
        title: "Total Users",
        value: stats.totalUsers.toString(),
        change: stats.userGrowth.toFixed(1) + '%',
        trend: stats.userGrowth >= 0 ? ('up' as const) : ('down' as const),
        icon: <Users className="h-5 w-5 text-blue-500" />
      },
      {
        title: "Total Revenue",
        value: stats.totalRevenue.toLocaleString(undefined, { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }),
        change: stats.revenueGrowth.toFixed(1) + '%',
        trend: stats.revenueGrowth >= 0 ? ('up' as const) : ('down' as const),
        icon: <CreditCard className="h-5 w-5 text-green-500" />,
        prefix: "KSH "
      },
      {
        title: "Active Vehicles",
        value: stats.activeVehicles.toLocaleString(),
        change: `${stats.vehicleGrowth >= 0 ? '+' : ''}${stats.vehicleGrowth.toFixed(1)}%`,
        trend: stats.vehicleGrowth >= 0 ? ('up' as const) : ('down' as const),
        icon: <Bus className="h-5 w-5 text-yellow-500" />
      },
      {
        title: "Registered SACCOs",
        value: stats.totalSaccos.toLocaleString(),
        change: `${stats.saccoGrowth >= 0 ? '+' : ''}${stats.saccoGrowth.toFixed(1)}%`,
        trend: stats.saccoGrowth >= 0 ? ('up' as const) : ('down' as const),
        icon: <Building2 className="h-5 w-5 text-purple-500" />
      }
    ];
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {getStatsData().map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );

  const renderTransactions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <p className="text-center text-gray-500">No recent transactions</p>
          ) : (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">Transaction #{transaction.id}</p>
                  <p className="text-sm text-gray-500">
                    User: {transaction.user_name} (ID: {transaction.user_id})
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">KSH {transaction.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.transaction_time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderSaccos = () => (
    <Card>
      <CardHeader>
        <CardTitle>Active SACCOs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeSaccos.length === 0 ? (
            <p className="text-center text-gray-500">No active SACCOs</p>
          ) : (
            activeSaccos.map((sacco: Sacco) => (
              <div key={sacco.id} className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                    {sacco.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{sacco.name}</p>
                    <p className="text-sm text-gray-500">{sacco.vehicle_count} vehicles</p>
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Active
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
      </div>

      {renderStats()}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {renderTransactions()}
        {renderSaccos()}
      </div>
    </div>
  );
};

export default AdminDashboard;
