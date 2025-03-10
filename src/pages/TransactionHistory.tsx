
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Download, Filter } from "lucide-react";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useState } from "react";

const TransactionHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Mock transaction data - In a real app, this would come from your backend
  const transactions = [
    { id: 1, type: "Payment", route: "Nairobi - Mombasa", amount: 1000, date: "2023-06-15", vehicle: "KBZ 123A", sacco: "Metro Trans SACCO" },
    { id: 2, type: "Top Up", route: "", amount: 2000, date: "2023-06-10", vehicle: "", sacco: "" },
    { id: 3, type: "Payment", route: "Nairobi - Nakuru", amount: 500, date: "2023-06-08", vehicle: "KDE 789C", sacco: "City Hoppa SACCO" },
    { id: 4, type: "Payment", route: "Nairobi - Kisumu", amount: 1200, date: "2023-06-05", vehicle: "KBZ 123A", sacco: "Metro Trans SACCO" },
    { id: 5, type: "Top Up", route: "", amount: 3000, date: "2023-06-01", vehicle: "", sacco: "" },
    { id: 6, type: "Payment", route: "Nairobi - Nakuru", amount: 500, date: "2023-05-28", vehicle: "KCY 456B", sacco: "Metro Trans SACCO" },
    { id: 7, type: "Payment", route: "Nairobi - Mombasa", amount: 1000, date: "2023-05-25", vehicle: "KDE 789C", sacco: "City Hoppa SACCO" },
    { id: 8, type: "Top Up", route: "", amount: 1500, date: "2023-05-20", vehicle: "", sacco: "" },
  ];

  // For the demo, we'll show 5 items per page
  const itemsPerPage = 5;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <History size={24} />
              Transaction History
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Details</th>
                    <th className="text-right p-3">Amount (KSH)</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{transaction.date}</td>
                      <td className="p-3">{transaction.type}</td>
                      <td className="p-3">
                        {transaction.type === "Payment" ? (
                          <div>
                            <div>{transaction.route}</div>
                            <div className="text-xs text-gray-500">
                              {transaction.vehicle} • {transaction.sacco}
                            </div>
                          </div>
                        ) : (
                          "Wallet Top Up"
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">
                        <span className={transaction.type === "Payment" ? "text-destructive" : "text-green-600"}>
                          {transaction.type === "Payment" ? "-" : "+"}
                          {transaction.amount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionHistory;
