import { memo } from 'react';
import { AppProviders } from './app/providers/AppProviders';

const AppComponent = () => {
  return <AppProviders />;
};

// Prevent unnecessary re-renders of the entire app
export default memo(AppComponent);
