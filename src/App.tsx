import { CostProvider } from './lib/CostContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { ComputeSection } from './features/compute/ComputeSection';
import { GpuSection } from './features/gpu/GpuSection';
import { StorageSection } from './features/storage/StorageSection';
import { NetworkSection } from './features/network/NetworkSection';
import { TotalSection } from './features/total/TotalSection';
import { SavingsProvider } from './features/savings/SavingsContext';
import { SavingsIntro } from './features/savings/SavingsIntro';
import { AttributionSection } from './features/savings/AttributionSection';
import { CounterfactualSection } from './features/savings/CounterfactualSection';
import { PerformanceSection } from './features/savings/PerformanceSection';
import { RoutingSection } from './features/savings/RoutingSection';
import { OffloadSection } from './features/savings/OffloadSection';

export default function App() {
  return (
    <CostProvider>
      <Header />
      <main id="top">
        <Hero />
        <ComputeSection />
        <GpuSection />
        <StorageSection />
        <NetworkSection />
        <TotalSection />
        <SavingsProvider>
          <SavingsIntro />
          <AttributionSection />
          <CounterfactualSection />
          <PerformanceSection />
          <RoutingSection />
          <OffloadSection />
        </SavingsProvider>
      </main>
      <Footer />
    </CostProvider>
  );
}
