import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

// Define the context for the stepper
interface StepperContextProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  completeStep: (step: number) => void;
  completedSteps: Set<number>;
}

const StepperContext = createContext<StepperContextProps | undefined>(undefined);

// Step component props
interface StepProps {
  index: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  isLastStep?: boolean;
  state?: string;
}

// Stepper component props
interface StepperProps {
  activeStep?: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  children: React.ReactNode;
  className?: string;
}

export function useStepperContext() {
  const context = useContext(StepperContext);
  
  if (!context) {
    throw new Error('useStepperContext must be used within a Stepper');
  }
  
  return context;
}

export function Stepper({
  activeStep: controlledActiveStep,
  initialStep = 0,
  onStepChange,
  className,
  children,
}: StepperProps) {
  const [internalActiveStep, setInternalActiveStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  const activeStep = controlledActiveStep !== undefined ? controlledActiveStep : internalActiveStep;
  
  const setActiveStep = (step: number) => {
    if (controlledActiveStep === undefined) {
      setInternalActiveStep(step);
    }
    onStepChange?.(step);
  };
  
  const completeStep = (step: number) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      newSet.add(step);
      return newSet;
    });
  };
  
  const contextValue = {
    activeStep,
    setActiveStep,
    completeStep,
    completedSteps,
  };
  
  // Get the count of steps for rendering the connector lines
  const childrenArray = React.Children.toArray(children);
  const stepsCount = childrenArray.length;
  
  return (
    <StepperContext.Provider value={contextValue}>
      <div className={cn("w-full", className)}>
        <div className="flex flex-col space-y-4">
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<StepProps>, {
                index,
                isLastStep: index === stepsCount - 1,
              });
            }
            return child;
          })}
        </div>
      </div>
    </StepperContext.Provider>
  );
}

export function Step({
  index,
  title,
  description,
  children,
  isLastStep = false,
}: StepProps & { isLastStep?: boolean }) {
  const { activeStep, completedSteps } = useStepperContext();
  
  const isActive = activeStep === index;
  const isCompleted = completedSteps.has(index);
  const isPending = activeStep < index;
  
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-start mb-4">
        <div className="flex flex-col items-center mr-4">
          <div 
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2",
              isActive ? "border-primary bg-primary text-white" :
              isCompleted ? "border-green-500 bg-green-500 text-white" :
              "border-gray-300 bg-white text-gray-300"
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </div>
          {!isLastStep && (
            <div 
              className={cn(
                "h-full w-0.5 my-1",
                isCompleted ? "bg-green-500" : "bg-gray-300"
              )}
              style={{ height: '24px' }}
            />
          )}
        </div>
        <div className="flex-1">
          <h3 
            className={cn(
              "text-base font-semibold",
              isActive ? "text-primary" : 
              isCompleted ? "text-green-500" : 
              "text-gray-500"
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      
      <div
        className={cn(
          "transition-all duration-300",
          isActive ? "block" : "hidden"
        )}
      >
        {children}
      </div>
    </div>
  );
}