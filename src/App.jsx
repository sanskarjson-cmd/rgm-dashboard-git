import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FilterProvider }        from "./context/FilterContext";
import LoginPage      from "./pages/LoginPage";
import HomePage       from "./pages/HomePage";
import PricingAndPack from "./pages/PricingAndPack";
import PromotionsPage from "./pages/PromotionsPage";
import Navbar         from "./components/Navbar";
import SideNav        from "./components/SideNav";
import TradeTermsPage     from "./pages/Tradetermspage";
import AssortmentMixPage      from "./pages/AssortmentMixPage";
import SkuRationalizationPage from "./pages/SkuRationalizationPage";
import { PERSONA_CONFIG } from "./data/mockData";

function UnderConstruction({ page }) {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f2f8" }}>
      <div style={{ textAlign:"center", maxWidth:320 }}>
        <div style={{ width:64, height:64, borderRadius:16, background:"#e8e8f4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
          <svg style={{ width:28, height:28, color:"#8080cf" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <p style={{ fontSize:10, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", letterSpacing:".12em", textTransform:"uppercase", marginBottom:6 }}>In Build</p>
        <h2 style={{ fontSize:20, fontFamily:"'MarsExtrabold',system-ui", color:"#6b6b80", marginBottom:10 }}>{page}</h2>
        <p style={{ fontSize:13, color:"#8b8fb8", lineHeight:1.6 }}>This workspace is under development.</p>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:20 }}>
          {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#c0c0d8", animation:`pulse 1.4s ease-in-out ${i*.28}s infinite` }}/>)}
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState("Home");

  if (!user) return <LoginPage/>;

  const personaCfg = PERSONA_CONFIG[user?.role] || PERSONA_CONFIG["Finance"];
  const livePages  = personaCfg.livePages;

  return (
    <FilterProvider>
      <div style={{ height:"100vh", width:"100vw", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Top navbar with filter strip */}
        <Navbar/>

        {/* Body: left sidenav + content */}
        <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>

          {/* Left sidebar navigation */}
          <SideNav activePage={activePage} setActivePage={setActivePage}/>

          {/* Main content */}
          <main style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0, minWidth:0 }}>
            {activePage === "Home"         && <HomePage/>}
            {activePage === "Pricing Strategy" && <PricingAndPack/>}
            {activePage === "Promotions"   && <PromotionsPage/>}
            {activePage === "Trade & Terms"      && <TradeTermsPage/>}
          {activePage === "Pack-Price Architecture"      && <AssortmentMixPage/>}
          {activePage === "SKU Rationalization"   && <SkuRationalizationPage/>}
          {!livePages.includes(activePage) && <UnderConstruction page={activePage}/>}
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell/>
    </AuthProvider>
  );
}