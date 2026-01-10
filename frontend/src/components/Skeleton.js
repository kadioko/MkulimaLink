import React from 'react';
import { clsx } from 'clsx';

// Base Skeleton component
export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
      {...props}
    />
  );
};

// Text skeleton
export const SkeletonText = ({ lines = 3, className }) => {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

// Avatar skeleton
export const SkeletonAvatar = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <Skeleton className={clsx('rounded-full', sizes[size], className)} />
  );
};

// Button skeleton
export const SkeletonButton = ({ width = 'w-24', className }) => {
  return <Skeleton className={clsx('h-10 rounded-lg', width, className)} />;
};

// Image skeleton
export const SkeletonImage = ({ aspectRatio = 'aspect-video', className }) => {
  return <Skeleton className={clsx(aspectRatio, 'w-full rounded-lg', className)} />;
};

// Product Card skeleton
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SkeletonImage aspectRatio="aspect-square" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

// Product List skeleton
export const ProductListSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Chat Message skeleton
export const ChatMessageSkeleton = ({ isOwn = false }) => {
  return (
    <div className={clsx('flex gap-3', isOwn ? 'flex-row-reverse' : '')}>
      <SkeletonAvatar size="sm" />
      <div className={clsx('space-y-2', isOwn ? 'items-end' : '')}>
        <Skeleton className="h-4 w-20" />
        <Skeleton className={clsx('h-16 rounded-xl', isOwn ? 'w-48' : 'w-56')} />
      </div>
    </div>
  );
};

// Chat List skeleton
export const ChatListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
};

// Table Row skeleton
export const TableRowSkeleton = ({ columns = 5 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Dashboard Stats skeleton
export const DashboardStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-24 mt-4" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      ))}
    </div>
  );
};

// Profile skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <SkeletonAvatar size="xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Page Loading skeleton
export const PageLoadingSkeleton = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <DashboardStatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <Skeleton className="h-6 w-32 mb-4" />
          <TableSkeleton rows={4} columns={3} />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
