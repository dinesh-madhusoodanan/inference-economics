import { CostProvider } from './lib/CostContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { ComputeSection } from './features/compute/ComputeSection';
import { GpuSection } from './features/gpu/GpuSection';
import { StorageSection } from './features/storage/StorageSection';
import { NetworkSection } from './features/network/NetworkSection';
import { TotalSection } from './features/total/TotalSection';

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
      </main>
      <Footer />
    </CostProvider>
  );
}
