import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { CashierPinScreen } from './src/screens/CashierPinScreen';
import { CartReviewScreen } from './src/screens/CartReviewScreen';
import { DeviceActivationScreen } from './src/screens/DeviceActivationScreen';
import { EndOfDaySyncScreen } from './src/screens/EndOfDaySyncScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import { PosRegisterScreen } from './src/screens/PosRegisterScreen';
import { ReceiptSuccessScreen } from './src/screens/ReceiptSuccessScreen';
import { StockRestockModal } from './src/screens/StockRestockModal';
import { TimeclockScreen } from './src/screens/TimeclockScreen';
import { usePosStore } from './src/stores/usePosStore';
import { ThermalReceiptData } from './src/types';

type Screen = 'activation' | 'pin' | 'menu' | 'cart' | 'payment' | 'receipt' | 'endofday';

export default function App() {
  const [screen, setScreen] = useState<Screen>('activation');
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isTimeclockOpen, setIsTimeclockOpen] = useState(false);
  const [lastReceiptData, setLastReceiptData] = useState<ThermalReceiptData | null>(null);
  const device = usePosStore((s) => s.device);

  // Auto-skip activation if already activated
  React.useEffect(() => {
    if (device && screen === 'activation') setScreen('pin');
  }, [device]);

  const renderScreen = () => {
    switch (screen) {
      case 'activation':
        return <DeviceActivationScreen onActivated={() => setScreen('pin')} />;
      case 'pin':
        return <CashierPinScreen onAuthenticated={() => setScreen('menu')} />;
      case 'menu':
        return (
          <>
            <PosRegisterScreen
              onLogout={() => setScreen('pin')}
              onOpenRestock={() => setIsRestockOpen(true)}
              onOpenTimeclock={() => setIsTimeclockOpen(true)}
              onOpenEndOfDay={() => setScreen('endofday')}
              onOpenCart={() => setScreen('cart')}
            />
            <StockRestockModal visible={isRestockOpen} onClose={() => setIsRestockOpen(false)} />
            <TimeclockScreen visible={isTimeclockOpen} onClose={() => setIsTimeclockOpen(false)} />
          </>
        );
      case 'cart':
        return (
          <CartReviewScreen
            onBack={() => setScreen('menu')}
            onProceed={() => setScreen('payment')}
          />
        );
      case 'payment':
        return (
          <PaymentScreen
            onBack={() => setScreen('cart')}
            onSuccess={(receipt) => {
              setLastReceiptData(receipt);
              setScreen('receipt');
            }}
          />
        );
      case 'receipt':
        return lastReceiptData ? (
          <ReceiptSuccessScreen
            receiptData={lastReceiptData}
            onNewOrder={() => setScreen('menu')}
          />
        ) : null;
      case 'endofday':
        return <EndOfDaySyncScreen visible={true} onClose={() => setScreen('menu')} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
});
