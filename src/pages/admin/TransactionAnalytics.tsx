
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

const TransactionAnalytics = () => {
  // Mock transaction data for charts
  const monthlyTransactions = [
    { name: "Jan", completed: 65, failed: 12 },
    { name: "Feb", completed: 59, failed: 10 },
    { name: "Mar", completed: 80, failed: 15 },
    { name: "Apr", completed: 81, failed: 11 },
    { name: "May", completed: 56, failed: 8 },
    { name: "Jun", completed: 55, failed: 10 },
    { name: "Jul", completed: 40, failed: 5 },
  ];

  const dailyRevenue = [
    { day: "Mon", amount: 12000 },
    { day: "Tue", amount: 19000 },
    { day: "Wed", amount: 15000 },
    { day: "Thu", amount: 18000 },
    { day: "Fri", amount: 21000 },
    { day: "Sat", amount: 16000 },
    { day: "Sun", amount: 9000 },
  ];

  const paymentMethods = [
    { name: "M-Pesa", value: 65 },
    { name: "Card", value: 20 },
    { name: "Cash", value: 10 },
    { name: "Other", value: 5 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transaction Analytics</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18,345</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH 985,240</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.3%</div>
            <p className="text-xs text-muted-foreground">+0.5% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transaction Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH 125</div>
            <p className="text-xs text-muted-foreground">+3.1% from last month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Transactions</CardTitle>
            <CardDescription>Number of completed vs. failed transactions</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTransactions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#0088FE" name="Completed" />
                  <Bar dataKey="failed" fill="#FF8042" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
            <CardDescription>Last 7 days revenue trend</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`KSH ${value}`, "Amount"]} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0088FE" 
                    activeDot={{ r: 8 }} 
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution of payment methods used</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionAnalytics;
