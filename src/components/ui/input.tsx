import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, startIcon, endIcon, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {startIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                        {startIcon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm text-foreground",
                        startIcon ? "pr-10" : "",
                        endIcon ? "pl-10" : "",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {endIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {endIcon}
                    </div>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
