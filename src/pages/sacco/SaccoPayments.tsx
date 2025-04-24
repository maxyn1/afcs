import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import saccoAdminService from "@/services/saccoAdminService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Download, Filter } from "lucide-react";

const SaccoPayments = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: paymentData, isLoading } = useQuery({
    queryKey: ['saccoPayments', page, searchTerm, filterStatus, dateRange],
    queryFn: () => saccoAdminService.getPayments({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      page,
      searchTerm,
      filterStatus: filterStatus !== "all" ? filterStatus : undefined,
    }),
  });

  const { data: paymentStats } = useQuery({
    queryKey: ['saccoPaymentStats'],
    queryFn: saccoAdminService.getPaymentStats,
  });

  // Dummy data for demonstration
  const payments = paymentData?.data || [
    { id: 1, user_name: "John Doe", amount: 500, transaction_type: "payment", status: "completed", transaction_time: "2025-04-23T14:30:00", payment_method: "Mobile Money" },
    { id: 2, user_name: "Jane Smith", amount: 1000, transaction_type: "top_up", status: "completed", transaction_time: "2025-04-22T09:15:00", payment_method: "Card" },
    { id: 3, user_name: "Robert Johnson", amount: 750, transaction_type: "payment", status: "completed", transaction_time: "2025-04-21T18:45:00", payment_method: "Mobile Money" },
    { id: 4, user_name: "Emily Davis", amount: 250, transaction_type: "refund", status: "pending", transaction_time: "2025-04-20T11:20:00", payment_method: "Wallet" },
    { id: 5, user_name: "Michael Wilson", amount: 1200, transaction_type: "payment", status: "completed", transaction_time: "2025-04-19T16:10:00", payment_method: "Card" },
  ];

  const totalPages = paymentData?.totalPages || 3;

  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality would trigger query refetch
  };

  const handleExport = () => {
    // Export functionality
    alert("Exporting payment data to CSV");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case "payment":
        return "Payment";
      case "top_up":
        return "Top Up";
      case "refund":
        return "Refund";
      case "withdrawal":
        return "Withdrawal";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payments Management</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <CardDescription className="text-2xl font-bold">
              KES {paymentStats?.totalRevenue || '128,500.00'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              From all completed payments
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions This Month
            </CardTitle>
            <CardDescription className="text-2xl font-bold">
              {paymentStats?.transactionsThisMonth || 245}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Total number of transactions
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
            <CardDescription className="text-2xl font-bold">
              {paymentStats?.pendingPayments || 8}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Payments requiring review
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            Manage and view all payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
            
            <div className="flex items-center gap-2">
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">Loading...</TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">No payments found</TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.id}</TableCell>
                      <TableCell>{payment.user_name}</TableCell>
                      <TableCell>KES {payment.amount.toFixed(2)}</TableCell>
                      <TableCell>{getTransactionTypeLabel(payment.transaction_type)}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>{new Date(payment.transaction_time).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(payment.status)}`}>
                          {payment.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(i + 1);
                    }}
                    isActive={page === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaccoPayments;