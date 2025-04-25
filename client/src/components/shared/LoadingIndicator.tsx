interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingIndicator({ 
  message = 'Finding your ride...', 
  fullScreen = true 
}: LoadingIndicatorProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50" 
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-lg font-medium text-gray-800">{message}</p>
        <p className="text-sm text-gray-600 mt-2">This may take a moment</p>
      </div>
    </div>
  );
}
