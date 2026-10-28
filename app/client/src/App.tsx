// Design philosophy: Halo Opaline — keep the dashboard dark, luminous, calm and data-first.
import Home from "@/pages/Home";
import DesktopWindowControls from "@/components/DesktopWindowControls";
import InstallAppGuide from "@/components/InstallAppGuide";
import StartupSplash from "@/components/StartupSplash";
import MerchantDataTools from "@/components/MerchantDataTools";

export default function App() {
  return <><DesktopWindowControls /><StartupSplash /><Home /><MerchantDataTools /><InstallAppGuide /></>;
}
