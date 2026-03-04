import { Card, CardContent } from "../../shared/components/Card";

export const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Card className="w-full max-w-sm">
      <CardContent className="p-8 text-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </CardContent>
    </Card>
  </div>
);
