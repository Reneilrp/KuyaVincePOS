import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { CashierPinScreen } from './src/screens/CashierPinScreen';
import { DeviceActivationScreen } from './src/screens/DeviceActivationScreen';
import { EndOfDaySyncScreen } from './src/screens/EndOfDaySyncScreen';
import { PosRegisterScreen } from './src/screens/PosRegisterScreen';
import { StockRestockModal } from './src/screens/StockRestockModal';
import { TimeclockScreen } from './src/screens/TimeclockScreen';
import { usePosStore } from './src/stores/usePosStore';

export default function App() {
  const [isActivated, setIsActivated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isTimeclockOpen, setIsTimeclockOpen] = useState(false);
  const [isEndOfDayOpen, setIsEndOfDayOpen] = useState(false);

  const device = usePosStore((s) => s.device);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {!isActivated && !device ? (
        <DeviceActivationScreen onActivated={() => setIsActivated(true)} />
      ) : !isAuthenticated ? (
        <CashierPinScreen onAuthenticated={() => setIsAuthenticated(true)} />
      ) : (
        <>
          <PosRegisterScreen
            onLogout={() => setIsAuthenticated(false)}
            onOpenRestock={() => setIsRestockOpen(true)}
            onOpenTimeclock={() => setIsTimeclockOpen(true)}
            onOpenEndOfDay={() => setIsEndOfDayOpen(true)}
          />
          <StockRestockModal visible={isRestockOpen} onClose={() => setIsRestockOpen(false)} />
          <TimeclockScreen visible={isTimeclockOpen} onClose={() => setIsTimeclockOpen(false)} />
          <EndOfDaySyncScreen visible={isEndOfDayOpen} onClose={() => setIsEndOfDayOpen(false)} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  }
});
