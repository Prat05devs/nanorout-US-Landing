import Hero from "@/components/sections/Hero";
import NisList from "@/components/sections/NisList";
import SignalRoute from "@/components/sections/SignalRoute";
import TriadVision from "@/components/sections/TriadVision";
import SignalLab from "@/components/sections/SignalLab";
import ClosingCta from "@/components/sections/ClosingCta";
import Marquee from "@/components/ui/Marquee";

export default function Home() {
  return (
    <>
      <Hero />
      <NisList />
      <SignalRoute />
      <TriadVision />
      <SignalLab />
      <ClosingCta />
      <Marquee />
    </>
  );
}
