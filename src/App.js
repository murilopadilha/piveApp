import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import '../gesture-handler';
import RootTabs from './navigation/RootTabs';

export default function App() {
  return (
    <NavigationContainer >
      <RootTabs />
    </NavigationContainer>
  )
}
