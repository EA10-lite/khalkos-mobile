import React from 'react';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  // Remove automatic initialization that causes crashes
  // Let the normal app flow handle routing
  return <>{children}</>;
};

export default AppInitializer;
