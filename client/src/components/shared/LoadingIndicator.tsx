interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingIndicator({ 
  message = 'Welcome to BookMyWhip', 
  fullScreen = true 
}: LoadingIndicatorProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-gradient-to-b from-primary/10 to-white dark:from-primary/30 dark:to-gray-900 flex items-center justify-center z-50" 
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClasses}>
      <div className="text-center max-w-md mx-auto px-6">
        {/* App Logo/icon */}
        <div className="mb-6 flex justify-center">
          <img 
            src="/attached_assets/bookmywhip_app_icon.png" 
            alt="BookMyWhip" 
            className="w-24 h-24 object-contain"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-gradient mb-2">{message}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Your premium ride-hailing experience</p>
        
        {/* Loading spinner */}
        <div className="relative h-2 max-w-xs mx-auto bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-emerald-500 animate-pulse-slow rounded-full" style={{width: '100%'}}></div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading your experience</p>
      </div>
    </div>
  );
}
