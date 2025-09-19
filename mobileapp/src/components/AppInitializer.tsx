import React from 'react';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  return <>{children}</>;
};

export default AppInitializer;
