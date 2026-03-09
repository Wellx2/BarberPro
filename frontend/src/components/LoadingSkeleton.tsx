import React from 'react';

/**
 * Loading Skeleton estilo Facebook
 * Exibido durante transições de contexto (troca de barbearia, login, etc.)
 */
export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            
            {/* Nav Items */}
            <div className="hidden md:flex space-x-4">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            
            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              {/* Card Image */}
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
              
              {/* Card Title */}
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              
              {/* Card Description */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
              
              {/* Card Button */}
              <div className="mt-4 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Shimmer effect overlay */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .7;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Skeleton compacto para transições rápidas
 */
export const LoadingSkeletonCompact: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {/* Spinner */}
        <div className="mx-auto w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        
        {/* Text */}
        <div className="space-y-2">
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse"></div>
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton para lista de agendamentos
 */
export const AppointmentsSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Title */}
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>

      {/* Appointment Cards */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              
              <div className="flex-1">
                {/* Title */}
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/3"></div>
                
                {/* Details */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              
              {/* Status */}
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
