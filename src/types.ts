// Route interface shared between passenger components
export interface PassengerRoute {
  id: number;
  route: string;  // This is the formatted route name (e.g., "CBD - Westlands")
  fare: number;
  start_point?: string;
  end_point?: string;
}

export interface Vehicle {
  id: string;
  number: string;
  sacco_id: string;
}

export interface Transaction {
  id: string;
  route: string;
  amount: number;
  date: string;
  vehicleNumber?: string;
}