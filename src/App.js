import { NavigationContainer } from '@react-navigation/native';
import '../gesture-handler';
import TargetFoundationProvider from './providers/TargetFoundationProvider';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <TargetFoundationProvider>
      <NavigationContainer >
        <RootNavigator />
      </NavigationContainer>
    </TargetFoundationProvider>
  )
}
