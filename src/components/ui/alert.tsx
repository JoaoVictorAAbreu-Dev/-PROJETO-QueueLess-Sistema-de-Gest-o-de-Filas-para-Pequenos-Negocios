import * as React from "react";

import { cn } from "@/lib/utils";

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="alert"
      className={cn("rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive", className)}
      {...props}
    />
  );
}

export { Alert };
