import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import driverService, { Trip } from "@/services/driverService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const DriverTrips = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ['driverTrips', page, limit, activeTab],
    queryFn: () => driverService.getTripHistory(page, limit),
  });

  const trips = data?.trips || [];
  const totalPages = data?.totalPages || 1;

  const getBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const filteredTrips = trips.filter((trip: Trip) => {
    if (activeTab === "all") return true;
    return trip.status === activeTab;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Trip History</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="h-10 bg-muted/50 rounded animate-pulse w-full"></div>
              <div className="h-20 bg-muted/50 rounded animate-pulse w-full"></div>
              <div className="h-20 bg-muted/50 rounded animate-pulse w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trip History</h1>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Trips</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <TripList trips={filteredTrips} getBadgeVariant={getBadgeVariant} formatDate={formatDate} />
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <TripList trips={filteredTrips} getBadgeVariant={getBadgeVariant} formatDate={formatDate} />
        </TabsContent>
        <TabsContent value="in-progress" className="mt-6">
          <TripList trips={filteredTrips} getBadgeVariant={getBadgeVariant} formatDate={formatDate} />
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6">
          <TripList trips={filteredTrips} getBadgeVariant={getBadgeVariant} formatDate={formatDate} />
        </TabsContent>
      </Tabs>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {page > 1 && (
              <PaginationPrevious
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              />
            )}
          </PaginationItem>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                isActive={page === i + 1}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            {page < totalPages && (
              <PaginationNext
                onClick={() => setPage(prev => prev + 1)}
              />
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

interface TripListProps {
  trips: Trip[];
  getBadgeVariant: (status: string) => "default" | "secondary" | "outline" | "destructive";
  formatDate: (date: string) => string;
}

const TripList = ({ trips, getBadgeVariant, formatDate }: TripListProps) => {
  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-10 text-muted-foreground">
            No trips found for the selected filter
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <Card key={trip.id}>
          <CardHeader className="py-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{trip.route}</CardTitle>
              <Badge variant={getBadgeVariant(trip.status)}>
                {trip.status}
              </Badge>
            </div>
            <CardDescription>Trip #{trip.id}</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span>{formatDate(trip.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Time:</span>
                <span>
                  {new Date(trip.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Passengers:</span>
                <span>{trip.passengers}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Fare:</span>
                <span>KES {(trip.amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DriverTrips;
