"use client";

import { Check, Smartphone, Shield, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceTag } from "./PriceTag";
import { FlagIcon } from "./FlagIcon";

export function PlanDetails({ plan }: { plan: any }) {
  const sizeGB = (plan.volume / 1024 / 1024 / 1024).toFixed(1);
  
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Left: Plan Info */}
      <div className="space-y-6">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
            <p className="text-lg text-gray-500">
               {sizeGB} GB • {plan.duration} {plan.durationUnit}s
            </p>
        </div>

        <Card>
           <CardHeader>
             <CardTitle>Features</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <Wifi className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="font-medium">Speed</p>
                    <p className="text-sm text-gray-500">{plan.speed || "4G/LTE"}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Smartphone className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="font-medium">Network</p>
                    <p className="text-sm text-gray-500">Multi-network auto-switch</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Shield className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="font-medium">Type</p>
                    <p className="text-sm text-gray-500">Data Only (No Number)</p>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Right: Checkout Card */}
      <div className="md:pl-8">
         <Card className="border-2 border-blue-100 shadow-xl">
            <CardHeader className="bg-gray-50/50 border-b">
               <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Price</span>
                  <PriceTag price={plan.price} className="text-3xl" />
               </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
               <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span>Data</span>
                     <span className="font-medium">{sizeGB} GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span>Validity</span>
                     <span className="font-medium">{plan.duration} {plan.durationUnit}s</span>
                  </div>
               </div>
               
               <div className="h-px bg-gray-100" />

               <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                  Buy Now
               </Button>
               
               <p className="text-center text-xs text-gray-400">
                  Secure payment powered by Stripe
               </p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

