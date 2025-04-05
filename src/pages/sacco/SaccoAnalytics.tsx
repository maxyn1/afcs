
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import saccoAdminService from "@/services/saccoAdminService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, Download, ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SaccoAnalytics = () => {
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['saccoPayments', dateRange.startDate, dateRange.endDate],
    queryFn: () => saccoAdminService.getPayments(dateRange.startDate, dateRange.endDate),
  });

  const { data: statsData } = useQuery({
    queryKey: ['saccoDashboardStats'],
    queryFn: saccoAdminService.getDashboardStats,
  });

  // Example mock data (replace with actual data from your API)
  const revenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  const tripData = [
    { name: 'Mon', trips: 40 },
    { name: 'Tue', trips: 30 },
    { name: 'Wed', trips: 45 },
    { name: 'Thu', trips: 25 },
    { name: 'Fri', trips: 18 },
    { name: 'Sat', trips: 22 },
    { name: 'Sun', trips: 32 },
  ];

  const routeData = [
    { name: 'CBD-Westlands', value: 30 },
    { name: 'CBD-Karen', value: 25 },
    { name: 'CBD-Eastlands', value: 20 },
    { name: 'Westlands-Karen', value: 15 },
    { name: 'Other', value: 10 },
  ];

  const generateReport = () => {
    saccoAdminService.generateReport(reportType as 'daily' | 'weekly' | 'monthly');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateReport}>
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue (30 days)
            </CardTitle>
            <CardDescription className="text-2xl font-bold">
              KES {statsData?.dailyRevenue * 30 || '0.00'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">12.5%</span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trips (30 days)
            </CardTitle>
            <CardDescription className="text-2xl font-bold">
              {statsData?.totalTrips || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDown className="h-3 w-3 text-red-500" />
              <span className="text-red-500">3.2%</span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Passengers (30 days)
            </CardTitle>
            <CardDescription className="text-2xl font-bold">
              {statsData?.totalPassengers || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-amber-500" />
              <span className="text-amber-500">0.5%</span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>
                Revenue collected over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue (KES)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trips" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Trends</CardTitle>
              <CardDescription>
                Number of trips completed over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tripData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="trips" 
                      stroke="#82ca9d" 
                      activeDot={{ r: 8 }} 
                      name="Number of Trips"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="routes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Distribution</CardTitle>
              <CardDescription>
                Distribution of trips by route
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={routeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {routeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SaccoAnalytics;
