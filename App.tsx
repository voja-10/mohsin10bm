
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Edit3, ArrowRight, Loader2, Camera, User, Bookmark, History as HistoryIcon, Home as HomeIcon, Image as ImageIcon, Save, X as CloseIcon, CheckCircle2 } from 'lucide-react';
import BottomNav from './components/BottomNav';
import ScannerView from './components/ScannerView';
import AnalysisView from './components/AnalysisView';
import { getProductByBarcode } from './services/productService';
import { analyzeProduct, analyzeProductFromImage } from './services/aiService';
import { Product, ProductAnalysis, SkinType, UserProfile } from './types';
import { Html5Qrcode } from "html5-qrcode";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<ProductAnalysis | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('cosmetiProfile');
    if (saved) return JSON.parse(saved);
    return {
      name: "Sarah Jenkins",
      skinTypes: [SkinType.OILY, SkinType.SENSITIVE]
    };
  });

  const [editName, setEditName] = useState(userProfile.name);
  const [editSkinTypes, setEditSkinTypes] = useState<SkinType[]>(userProfile.skinTypes);
  
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load local history
    const history = localStorage.getItem('cosmetiHistory');
    if (history) setRecentProducts(JSON.parse(history));
  }, []);

  const handleScanSuccess = async (barcode: string) => {
    setIsScanning(false);
    setIsAnalyzing(true);
    
    try {
      // Step 1: Get product basics
      const productData = await getProductByBarcode(barcode);
      
      // Step 2: Use AI for full analysis
      const analysis = await analyzeProduct(
        productData?.name || "Unknown Product",
        productData?.brand || "Generic",
        productData?.ingredientsText || "",
        userProfile.skinTypes
      );

      if (analysis) {
        saveAnalysisResult(barcode, analysis);
      } else {
        alert("Could not analyze this product. Please try a different one.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during scanning.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsScanning(false);
    setIsAnalyzing(true);

    try {
      // First try to extract barcode from the file
      const tempScanner = new Html5Qrcode("app-file-scan-temp");
      try {
        const barcode = await tempScanner.scanFile(file, true);
        await tempScanner.clear();
        return handleScanSuccess(barcode);
      } catch (e) {
        console.log("No barcode found, proceeding with AI Image Analysis...");
      } finally {
        tempScanner.clear();
      }

      // If no barcode found, use Gemini Vision
      const base64 = await fileToBase64(file);
      const base64Data = base64.split(',')[1];
      const mimeType = file.type;

      const analysis = await analyzeProductFromImage(base64Data, mimeType, userProfile.skinTypes.map(s => s.toString()));

      if (analysis) {
        saveAnalysisResult(`IMAGE_${Date.now()}`, analysis);
      } else {
        alert("Could not identify product from image. Please try a clearer photo.");
      }
    } catch (error) {
      console.error("Image upload analysis failed", error);
      alert("Failed to analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAnalysisResult = (id: string, analysis: ProductAnalysis) => {
    setCurrentAnalysis(analysis);
    
    // Save to local history
    const newProduct: Product = {
      barcode: id,
      name: analysis.name,
      brand: analysis.brand,
      timestamp: Date.now(),
      analysis: analysis
    };
    const updatedHistory = [newProduct, ...recentProducts.slice(0, 9)];
    setRecentProducts(updatedHistory);
    localStorage.setItem('cosmetiHistory', JSON.stringify(updatedHistory));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const toggleSkinTypeEdit = (type: SkinType) => {
    if (editSkinTypes.includes(type)) {
      setEditSkinTypes(editSkinTypes.filter(t => t !== type));
    } else {
      setEditSkinTypes([...editSkinTypes, type]);
    }
  };

  const saveProfile = () => {
    const updatedProfile = { name: editName, skinTypes: editSkinTypes };
    setUserProfile(updatedProfile);
    localStorage.setItem('cosmetiProfile', JSON.stringify(updatedProfile));
    setIsEditingProfile(false);
  };

  const cancelProfileEdit = () => {
    setEditName(userProfile.name);
    setEditSkinTypes(userProfile.skinTypes);
    setIsEditingProfile(false);
  };

  const renderHome = () => (
    <div className="px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input 
        type="file" 
        ref={mainFileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
      />
      <div id="app-file-scan-temp" className="hidden"></div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Welcome Back</p>
          <h1 className="text-white text-2xl font-bold">{userProfile.name}</h1>
        </div>
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-400/30">
            <img src="https://picsum.photos/seed/user123/100/100" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0d1b1a] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#0d1b1a] rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search products or brands..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400/50 transition-colors"
          />
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setIsScanning(true)} 
            className="flex-1 bg-emerald-400 h-14 rounded-2xl flex items-center justify-center gap-2 text-black font-bold uppercase tracking-wider text-xs active:scale-95 transition-transform"
          >
            <Camera className="w-5 h-5" />
            Scan Barcode
          </button>
          <button 
            onClick={() => mainFileInputRef.current?.click()}
            className="flex-1 bg-white/5 border border-white/10 h-14 rounded-2xl flex items-center justify-center gap-2 text-white font-bold uppercase tracking-wider text-xs active:scale-95 transition-transform"
          >
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            Upload Photo
          </button>
        </div>
      </div>

      {/* Skin Type Badge */}
      <div className="glass rounded-3xl p-6 flex justify-between items-center border-l-4 border-emerald-400">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center">
            <User className="text-emerald-400 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-bold">{userProfile.skinTypes.join(" / ")} Skin</h3>
            <p className="text-gray-500 text-xs">Analysis tailored to you</p>
          </div>
        </div>
        <button 
          onClick={() => { setActiveTab('profile'); setIsEditingProfile(true); }} 
          className="text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-lg font-bold">Recent Activity</h2>
          <button onClick={() => setActiveTab('history')} className="text-emerald-400 text-xs font-bold uppercase tracking-widest">View All</button>
        </div>
        <div className="space-y-3">
          {recentProducts.length === 0 ? (
            <div className="text-center py-8 glass rounded-3xl">
              <p className="text-gray-500 text-sm">No recent scans yet</p>
            </div>
          ) : (
            recentProducts.slice(0, 3).map((p, idx) => (
              <div key={idx} className="glass rounded-2xl p-4 flex items-center justify-between border border-white/5 active:scale-[0.98] transition-transform" onClick={() => setCurrentAnalysis(p.analysis!)}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex items-center justify-center p-2">
                    <img src={`https://picsum.photos/seed/${p.name}/100/100`} alt={p.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[8px] font-bold uppercase tracking-widest">{p.brand}</p>
                    <h4 className="text-white text-sm font-bold truncate max-w-[150px]">{p.name}</h4>
                    <p className="text-gray-500 text-[10px]">Scanned {new Date(p.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-400 text-lg font-bold">{p.analysis?.safetyScore || '--'}</div>
                  <div className="text-gray-500 text-[8px] font-bold uppercase tracking-widest">Score</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h2 className="text-white text-lg font-bold">AI Recommended</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {[
            { name: "Paula's Choice", sub: "2% BHA Exfoliant", match: "98%", img: "p1" },
            { name: "COSRX", sub: "Snail 96 Mucin", match: "94%", img: "p2" },
            { name: "The Ordinary", sub: "Natural Factors", match: "91%", img: "p3" }
          ].map((item, idx) => (
            <div key={idx} className="glass rounded-3xl p-4 min-w-[200px] space-y-4 flex-shrink-0 relative overflow-hidden">
               <div className="absolute top-4 right-4 bg-emerald-400/20 text-emerald-400 text-[8px] font-bold px-2 py-1 rounded-full border border-emerald-400/30">
                {item.match} MATCH
               </div>
               <div className="w-full h-32 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-4">
                 <img src={`https://picsum.photos/seed/rec${idx}/200/200`} alt={item.name} className="w-full h-full object-contain" />
               </div>
               <div>
                 <h4 className="text-white font-bold text-sm">{item.name}</h4>
                 <p className="text-gray-500 text-xs">{item.sub}</p>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip of the Day */}
      <div className="glass rounded-3xl p-6 border-l-4 border-emerald-400 relative overflow-hidden">
         <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-400/5 rounded-full"></div>
         <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Tip of the Day</h3>
         <p className="text-gray-200 text-sm leading-relaxed italic">
          "Ingredients like Niacinamide are excellent for your {userProfile.skinTypes[0]?.toLowerCase()} skin type as they help regulate sebum production without drying you out."
         </p>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white text-2xl font-bold">Your Profile</h2>
        {!isEditingProfile && (
          <button 
            onClick={() => { setIsEditingProfile(true); setEditName(userProfile.name); setEditSkinTypes(userProfile.skinTypes); }} 
            className="p-2 bg-white/5 rounded-xl border border-white/10 text-emerald-400"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        )}
      </div>

      {isEditingProfile ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-4">
            <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-1">Skin Types (Select all that apply)</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(SkinType).map((type) => {
                const isSelected = editSkinTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleSkinTypeEdit(type)}
                    className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'bg-emerald-400 border-emerald-400 text-black' 
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    {type}
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={cancelProfileEdit}
              className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            >
              <CloseIcon className="w-5 h-5" />
              Cancel
            </button>
            <button 
              onClick={saveProfile}
              className="flex-1 bg-emerald-400 py-4 rounded-2xl text-black font-bold flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-400/20 relative">
              <img src="https://picsum.photos/seed/user123/200/200" alt="Profile" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 right-0 p-1 bg-emerald-400 rounded-full border-2 border-[#0d1b1a]">
                 <CheckCircle2 className="w-3 h-3 text-[#0d1b1a]" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-white text-xl font-bold">{userProfile.name}</h3>
              <p className="text-gray-500 text-sm">Verified Member</p>
            </div>
          </div>

          <div className="glass rounded-[2rem] p-8 space-y-6">
            <div>
              <h4 className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4">Your Skin Profile</h4>
              <div className="flex flex-wrap gap-2">
                {userProfile.skinTypes.map((type) => (
                  <div key={type} className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold">
                    {type}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-gray-400 text-sm">Total Scans</span>
                 <span className="text-white font-bold">{recentProducts.length}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-400 text-sm">Saved Products</span>
                 <span className="text-white font-bold">12</span>
               </div>
            </div>
          </div>

          <div className="space-y-3">
             <button className="w-full glass py-4 px-6 rounded-2xl flex items-center justify-between group">
               <div className="flex items-center gap-4">
                 <div className="p-2 bg-emerald-400/10 rounded-lg"><Bookmark className="w-5 h-5 text-emerald-400" /></div>
                 <span className="text-white font-medium">Saved Items</span>
               </div>
               <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
             </button>
             <button className="w-full glass py-4 px-6 rounded-2xl flex items-center justify-between group">
               <div className="flex items-center gap-4">
                 <div className="p-2 bg-emerald-400/10 rounded-lg"><Bell className="w-5 h-5 text-emerald-400" /></div>
                 <span className="text-white font-medium">Notifications</span>
               </div>
               <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
             </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch(activeTab) {
      case 'home': return renderHome();
      case 'history': return (
        <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          <h2 className="text-white text-2xl font-bold mb-6">Scan History</h2>
          <div className="space-y-4">
             {recentProducts.length === 0 ? (
               <div className="text-center py-20 opacity-50 space-y-4">
                  <HistoryIcon className="w-16 h-16 mx-auto" />
                  <p>Your scan history is empty</p>
               </div>
             ) : (
               recentProducts.map((p, idx) => (
                 <div key={idx} className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/5 active:scale-[0.98] transition-transform" onClick={() => setCurrentAnalysis(p.analysis!)}>
                   <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2">
                     <img src={`https://picsum.photos/seed/${p.name}/100/100`} className="w-full h-full object-contain" />
                   </div>
                   <div className="flex-1">
                     <p className="text-emerald-400 text-[8px] font-bold uppercase tracking-widest">{p.brand}</p>
                     <h4 className="text-white text-sm font-bold">{p.name}</h4>
                     <p className="text-gray-500 text-[10px] mt-0.5">{new Date(p.timestamp).toLocaleDateString()}</p>
                   </div>
                   <div className="text-center px-3 border-l border-white/10">
                      <span className="text-emerald-400 font-bold">{p.analysis?.safetyScore || '--'}</span>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>
      );
      case 'profile': return renderProfile();
      default: return <div className="p-10 text-center text-gray-500">Feature coming soon...</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto relative bg-[#0d1b1a] min-h-screen pb-10">
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-10 text-center">
          <div className="relative w-24 h-24 mb-6">
            <Loader2 className="w-24 h-24 text-emerald-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
            </div>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">AI Identifying & Analyzing</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Gemini is identifying the product and breaking down complex chemical structures to ensure they're safe for your <span className="text-emerald-400 font-bold">{userProfile.skinTypes[0] || 'unique'}</span> skin.
          </p>
          <div className="mt-8 flex gap-1">
             {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: `${i * 0.2}s`}} />)}
          </div>
        </div>
      )}

      {/* Main App Screens */}
      {isScanning ? (
        <ScannerView 
          onScanSuccess={handleScanSuccess} 
          onImageUpload={handleImageUpload}
          onClose={() => setIsScanning(false)} 
        />
      ) : currentAnalysis ? (
        <AnalysisView 
          analysis={currentAnalysis} 
          onBack={() => setCurrentAnalysis(null)} 
          onScanAnother={() => {
            setCurrentAnalysis(null);
            setIsScanning(true);
          }}
        />
      ) : (
        <>
          {renderTabContent()}
          <BottomNav 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onScanClick={() => setIsScanning(true)} 
          />
        </>
      )}
    </div>
  );
};

export default App;
