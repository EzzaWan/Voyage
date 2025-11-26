import Link from "next/link";
import { ArrowRight, Signal, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "./PriceTag";
import { Button } from "@/components/ui/button";

export interface Plan {
  packageCode: string;
  name: string;
  price: number;
  volume: number; // bytes
  duration: number;
  durationUnit: string;
  speed: string;
  location: string; // e.g. "JP"
}

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  // Convert bytes to GB
  const sizeGB = (plan.volume / 1024 / 1024 / 1024).toFixed(1);
  
  return (
    <Link href={`/plans/${plan.packageCode}`}>
      <Card className="h-full cursor-pointer transition-all hover:border-blue-500 hover:shadow-lg group">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
              {plan.duration} {plan.durationUnit}s
            </Badge>
            <Signal className="h-4 w-4 text-green-500" />
          </div>
          <CardTitle className="text-lg mt-2 group-hover:text-blue-600 transition-colors">
            {sizeGB} GB
          </CardTitle>
          <div className="text-sm text-gray-500 font-normal">{plan.name}</div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mt-4">
            <PriceTag price={plan.price} className="text-xl" />
            <Button size="sm" variant="ghost" className="group-hover:bg-blue-50 group-hover:text-blue-600">
              View <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
             <Globe className="h-3 w-3" /> {plan.location} Region
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

