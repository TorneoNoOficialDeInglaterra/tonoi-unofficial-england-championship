import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  icon?: "chevron" | "plus-minus";
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, icon = "chevron", ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
        icon === "chevron" && "[&[data-state=open]>svg]:rotate-180",
        icon === "plus-minus" &&
          "[&[data-state=open]_.icon-plus]:opacity-0 [&[data-state=open]_.icon-minus]:opacity-100",
        className,
      )}
      {...props}
    >
      {children}
      {icon === "chevron" ? (
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
      ) : (
        <span className="relative h-4 w-4 shrink-0">
          <Plus className="icon-plus absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
          <Minus className="icon-minus absolute inset-0 opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
        </span>
      )}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;


const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

