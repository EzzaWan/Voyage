"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutProgressProps {
  currentStep: number;
  steps?: string[];
}

export function CheckoutProgress({ 
  currentStep, 
  steps = ["Review", "Payment", "Confirmation"] 
}: CheckoutProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                  isCompleted 
                    ? "bg-[var(--voyage-accent)] border-[var(--voyage-accent)] text-white" 
                    : isCurrent
                    ? "bg-[var(--voyage-accent)]/20 border-[var(--voyage-accent)] text-[var(--voyage-accent)]"
                    : "bg-[var(--voyage-card)] border-[var(--voyage-border)] text-[var(--voyage-muted)]"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-bold">{stepNumber}</span>
                  )}
                </div>
                <span className={cn(
                  "mt-2 text-xs font-medium text-center",
                  isCurrent || isCompleted
                    ? "text-white"
                    : "text-[var(--voyage-muted)]"
                )}>
                  {step}
                </span>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 transition-all",
                  isCompleted
                    ? "bg-[var(--voyage-accent)]"
                    : "bg-[var(--voyage-border)]"
                )} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1 bg-[var(--voyage-border)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[var(--voyage-accent)] to-purple-500 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

