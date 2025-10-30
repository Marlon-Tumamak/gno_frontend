'use client';

import React, { useState, useEffect } from 'react';
import SkeletonLoader from './SkeletonLoader';

interface SkeletonExampleProps {
  variant?: 'analytics' | 'dashboard' | 'accounts' | 'revenue' | 'drivers' | 'trips' | 'upload';
  loading?: boolean;
  children?: React.ReactNode;
}

const SkeletonExample: React.FC<SkeletonExampleProps> = ({ 
  variant = 'analytics', 
  loading = true,
  children 
}) => {
  if (loading) {
    return <SkeletonLoader variant={variant} />;
  }

  return <>{children}</>;
};

export default SkeletonExample;
