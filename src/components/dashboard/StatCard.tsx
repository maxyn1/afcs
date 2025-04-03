import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  prefix?: string;
}

export const StatCard = ({ title, value, change, trend, icon, prefix = '' }: StatCardProps) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="bg-gray-100 p-2 rounded-full">
          {icon}
        </div>
        <div className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'} text-sm`}>
          {change}
          {trend === 'up' ? 
            <ArrowUpRight className="ml-1 h-4 w-4" /> : 
            <ArrowDownRight className="ml-1 h-4 w-4" />
          }
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold">{prefix}{value}</h3>
      </div>
    </CardContent>
  </Card>
);
