
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { X, Zap, History, Image as ImageIcon, CameraOff, RefreshCcw, Loader2 } from 'lucide-react';

interface ScannerViewProps {
  onScanSuccess: (decodedText: string) => void;
  onImageUpload: (file: File) => void;
  onClose: () => void;
}

const ScannerView: React.FC<ScannerViewProps> = ({ onScanSuccess, onImageUpload, onClose }) => {
  const [torchOn, setTorchOn] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanner = useCallback(async () => {
    setIsInitializing(true);
    setPermissionError(null);
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      const config = { fps: 10, qrbox: { width: 280, height: 160 } };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        () => {
          // Frame errors are normal during scanning
        }
      );
      setIsInitializing(false);
    } catch (err: any) {
      console.error("Unable to start scanner", err);
      setIsInitializing(false);
      
      if (err.name === "NotAllowedError" || err.toString().includes("Permission denied")) {
        setPermissionError("Camera access was denied. Please enable camera permissions in your browser settings to scan products.");
      } else {
        setPermissionError("Could not access the camera. Please make sure no other app is using it and try again.");
      }
    }
  }, [onScanSuccess]);

  useEffect(() => {
    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(e => console.error("Error stopping scanner", e));
      }
    };
  }, [startScanner]);

  const toggleTorch = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        const state = !torchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: state } as any]
        });
        setTorchOn(state);
      }
    } catch (e) {
      console.warn("Torch not supported on this device or camera not active");
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    
    try {
      // Create a temporary scanner to scan the file
      const html5QrCode = new Html5Qrcode("file-scan-temp");
      
      try {
        const decodedText = await html5QrCode.scanFile(file, true);
        onScanSuccess(decodedText);
      } catch (scanError) {
        console.log("No barcode found in image, falling back to AI image analysis", scanError);
        onImageUpload(file);
      } finally {
        html5QrCode.clear();
      }
    } catch (err) {
      console.error("Error processing file", err);
      onImageUpload(file);
    } finally {
      setIsProcessingFile(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />
      {/* Invisible element for file scanning logic */}
      <div id="file-scan-temp" className="hidden"></div>

      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent absolute top-0 w-full z-10">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">AI Active</span>
        </div>
        <button 
          onClick={toggleTorch} 
          disabled={!!permissionError || isInitializing}
          className={`p-2 rounded-full transition-colors ${torchOn ? 'bg-emerald-400 text-black' : 'bg-white/10 text-white'} ${ (permissionError || isInitializing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Zap className="w-6 h-6" />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900">
        <div id="reader" className="w-full h-full"></div>
        
        {/* Processing File State */}
        {isProcessingFile && (
          <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
            <p className="text-white font-bold">Scanning Image...</p>
          </div>
        )}

        {/* Permission Error State */}
        {permissionError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
            <div className="glass p-8 rounded-[2rem] border-rose-500/30 text-center max-w-xs animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CameraOff className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Camera Access Required</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                {permissionError}
              </p>
              <button 
                onClick={startScanner}
                className="w-full bg-emerald-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RefreshCcw className="w-4 h-4" />
                Retry Access
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isInitializing && !permissionError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Initializing Camera</p>
            </div>
          </div>
        )}
        
        {/* Scanner Overlay UI */}
        {!permissionError && !isInitializing && !isProcessingFile && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-72 h-40 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/30 animate-pulse"></div>
              <p className="absolute -top-10 left-0 right-0 text-center text-emerald-400 text-sm font-medium">Align barcode within frame</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-8 bg-[#162927] flex justify-around items-center">
        <div className="flex flex-col items-center gap-2">
          <button onClick={handleGalleryClick} className="p-4 bg-white/5 rounded-2xl active:scale-95 transition-transform">
            <ImageIcon className="w-6 h-6 text-white" />
          </button>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Gallery</span>
        </div>

        <div className="w-20 h-20 rounded-full border-4 border-emerald-400/30 flex items-center justify-center p-1">
          <button 
            onClick={onClose}
            className="w-full h-full rounded-full bg-emerald-400 flex items-center justify-center active:scale-90 transition-transform"
          >
            <X className="w-8 h-8 text-black rotate-45" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button className="p-4 bg-white/5 rounded-2xl active:scale-95 transition-transform">
            <History className="w-6 h-6 text-white" />
          </button>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">History</span>
        </div>
      </div>

      {/* AI Label */}
      <div className="bg-[#1e3a36] p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-white text-sm font-semibold">AI Ingredient Analysis</span>
        </div>
        <p className="text-gray-400 text-xs">Scanner will automatically identify harmful ingredients</p>
      </div>
    </div>
  );
};

export default ScannerView;
