import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;         // Cambiado a string opcional (ej: "+12%")
    trendUp?: boolean;      // Nuevo prop para determinar si es verde o rojo
    description?: string;
}

const KPICard = ({
                     title,
                     value,
                     icon: Icon,
                     trend,
                     trendUp,
                     description
                 }: KPICardProps) => {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-gray-200">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold dark:text-gray-100">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {trend && (
                            <span className={trendUp === true ? "text-green-600 dark:text-green-400 font-medium" : trendUp === false ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                {trend}
              </span>
                        )}
                        <span className="opacity-80">
              {description}
            </span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default KPICard;