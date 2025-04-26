import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export type StepState = 'inactive' | 'active' | 'complete';

interface StepProps {
  title: string;
  description?: string;
  state?: StepState;
}

interface StepperProps {
  activeStep: number;
  children: React.ReactNode;
  className?: string;
}

export function Step({ title, description, state = 'inactive' }: StepProps) {
  return (
    <div className={cn(
      'flex flex-1 flex-col items-center',
      state === 'inactive' && 'text-gray-400',
      state === 'active' && 'text-primary',
      state === 'complete' && 'text-green-500'
    )}>
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2">
        {state === 'complete' ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : (
          <span className="text-lg font-medium">{state === 'active' ? '•' : ''}</span>
        )}
      </div>
      <div className="text-center">
        <h3 className="font-medium text-sm">{title}</h3>
        {description && (
          <p className="text-xs mt-1 max-w-[120px]">{description}</p>
        )}
      </div>
    </div>
  );
}

export function Stepper({ activeStep, children, className }: StepperProps) {
  const steps = React.Children.toArray(children);
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={index}>
              {step}
              
              {!isLast && (
                <div className={cn(
                  'h-px flex-1 mx-2',
                  index < activeStep ? 'bg-green-500' : 'bg-gray-300'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}