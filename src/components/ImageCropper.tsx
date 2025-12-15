"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface ImageCropperProps {
  image: string;
  originalFile?: File;
  onCropComplete: (croppedImage: string, mimeType: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, originalFile, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processingGif, setProcessingGif] = useState(false);
  const isGif = originalFile?.type === 'image/gif';
  
  // Detect the original file type, default to the file's mime type or image/jpeg
  const getMimeType = (): string => {
    if (originalFile) {
      return originalFile.type;
    }
    // Try to detect from data URL
    if (image.startsWith('data:')) {
      const match = image.match(/data:([^;]+)/);
      if (match) {
        return match[1];
      }
    }
    return 'image/jpeg';
  };

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedGif = async (
    file: File,
    pixelCrop: Area
  ): Promise<{ url: string; mimeType: string }> => {
    setProcessingGif(true);
    try {
      // Use gifuct-js to parse the GIF and preserve animation
      console.log('Importing GIF libraries...');
      const { parseGIF, decompressFrames } = await import('gifuct-js');
      
      // Import GIF.js - it's a UMD module that sets window.GIF
      let GIF: any;
      let gifModule: any = null;
      
      if (typeof window !== 'undefined' && (window as any).GIF) {
        GIF = (window as any).GIF;
        console.log('Using existing window.GIF');
      } else {
        // Import the library - it will set window.GIF
        console.log('Loading GIF.js from node_modules...');
        gifModule = await import('gif.js');
        // gif.js exports as a UMD module, try different ways to access it
        GIF = (gifModule as any).default || (window as any).GIF || gifModule;
        if (!GIF && typeof window !== 'undefined') {
          // Wait a bit for UMD to set window.GIF
          await new Promise(resolve => setTimeout(resolve, 100));
          GIF = (window as any).GIF;
        }
      }
      
      if (!GIF || typeof GIF !== 'function') {
        console.error('GIF not found. Available:', { 
          windowGIF: typeof window !== 'undefined' ? typeof (window as any).GIF : 'N/A',
          module: gifModule ? Object.keys(gifModule) : 'no module'
        });
        throw new Error('Could not load GIF.js library. Make sure gif.js is properly installed.');
      }
      console.log('GIF library loaded successfully, type:', typeof GIF);
      
      // Read the file as array buffer
      console.log('Reading GIF file...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('Parsing GIF...');
      const gif = parseGIF(arrayBuffer);
      console.log('Decompressing frames...');
      const frames = decompressFrames(gif, true);
      
      console.log(`Processing ${frames.length} frames...`);
      
      if (frames.length === 0) {
        throw new Error('No frames found in GIF');
      }
      
      // Create a new GIF encoder
      console.log('Creating GIF encoder...');
      const cropWidth = Math.round(pixelCrop.width);
      const cropHeight = Math.round(pixelCrop.height);
      
      const gifEncoder = new GIF({
        workers: 0, // Disable workers to avoid worker script issues
        quality: 10,
        width: cropWidth,
        height: cropHeight,
        repeat: 0, // Loop forever
      });
      console.log('GIF encoder created with dimensions:', cropWidth, 'x', cropHeight);
      
      // Build composite frame by frame
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = gif.lsd.width;
      compositeCanvas.height = gif.lsd.height;
      const compositeCtx = compositeCanvas.getContext('2d');
      
      if (!compositeCtx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set background color if global color table exists
      if ((gif as any).globalColorTable && (gif as any).globalColorTable.length >= 3) {
        const bgIndex = (gif as any).bgColorIndex || 0;
        const colorIndex = bgIndex * 3;
        if (colorIndex + 2 < (gif as any).globalColorTable.length) {
          compositeCtx.fillStyle = `rgb(${(gif as any).globalColorTable[colorIndex]}, ${(gif as any).globalColorTable[colorIndex + 1]}, ${(gif as any).globalColorTable[colorIndex + 2]})`;
          compositeCtx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
        }
      }
      
      // Process each frame
      console.log('Processing frames...');
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        if (i % 10 === 0 || i === frames.length - 1) {
          console.log(`Processing frame ${i + 1}/${frames.length}...`);
        }
        
        // Handle disposal method from previous frame
        if (i > 0) {
          const prevFrame = frames[i - 1];
          if (prevFrame.disposalType === 2) {
            // Clear to background
            compositeCtx.clearRect(
              prevFrame.dims.left,
              prevFrame.dims.top,
              prevFrame.dims.width,
              prevFrame.dims.height
            );
          }
        }
        
        // Draw the frame image data onto composite
        const imageData = compositeCtx.createImageData(frame.dims.width, frame.dims.height);
        imageData.data.set(frame.patch);
        compositeCtx.putImageData(imageData, frame.dims.left, frame.dims.top);
        
        // Create crop canvas for this frame
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = Math.round(pixelCrop.width);
        cropCanvas.height = Math.round(pixelCrop.height);
        const cropCtx = cropCanvas.getContext('2d');
        
        if (!cropCtx) {
          throw new Error('Could not get crop canvas context');
        }
        
        // Crop the composite frame
        cropCtx.drawImage(
          compositeCanvas,
          Math.round(pixelCrop.x),
          Math.round(pixelCrop.y),
          Math.round(pixelCrop.width),
          Math.round(pixelCrop.height),
          0,
          0,
          Math.round(pixelCrop.width),
          Math.round(pixelCrop.height)
        );
        
        // Add frame to GIF encoder with delay
        // GIF.js expects delay in milliseconds
        const delay = frame.delay || 10;
        const delayInMs = Math.max(20, delay * 10); // Convert to milliseconds, min 20ms
        if (i % 10 === 0 || i === frames.length - 1) {
          console.log(`Adding frame ${i + 1}/${frames.length} with delay: ${delayInMs}ms`);
        }
        gifEncoder.addFrame(cropCtx, { delay: delayInMs });
      }
      
      // Render the GIF with timeout
      console.log('All frames processed, rendering GIF...');
      return new Promise((resolve, reject) => {
        let resolved = false;
        
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            setProcessingGif(false);
            console.error('GIF processing timed out');
            reject(new Error('GIF processing timed out after 30 seconds. The GIF might be too large or have too many frames.'));
          }
        }, 30000);
        
        gifEncoder.on('finished', (blob: Blob) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.log('GIF encoding finished!');
            const url = URL.createObjectURL(blob);
            setProcessingGif(false);
            resolve({ url, mimeType: 'image/gif' });
          }
        });
        
        gifEncoder.on('progress', (p: number) => {
          console.log(`GIF encoding progress: ${Math.round(p * 100)}%`);
        });
        
        gifEncoder.on('error', (error: any) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            setProcessingGif(false);
            console.error('GIF encoder error:', error);
            reject(new Error(`GIF encoding failed: ${error?.message || 'Unknown error'}`));
          }
        });
        
        try {
          console.log('Starting GIF render...');
          gifEncoder.render();
        } catch (error: any) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            setProcessingGif(false);
            console.error('Error starting GIF render:', error);
            reject(new Error(`Failed to start GIF rendering: ${error?.message || 'Unknown error'}`));
          }
        }
      });
    } catch (error) {
      setProcessingGif(false);
      console.error('Error processing animated GIF:', error);
      throw error;
    }
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    mimeType: string
  ): Promise<{ url: string; mimeType: string }> => {
    // Special handling for GIFs - try to preserve animation
    if (mimeType === 'image/gif' && originalFile) {
      try {
        return await getCroppedGif(originalFile, pixelCrop);
      } catch (error) {
        console.warn("Failed to crop GIF with animation, falling back to static crop:", error);
        // Fall through to regular crop
      }
    }

    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    // Determine the output format based on original file type
    let outputMimeType = mimeType;
    if (mimeType === 'image/gif') {
      outputMimeType = 'image/gif';
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve({ url: "", mimeType: outputMimeType });
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ url, mimeType: outputMimeType });
      }, outputMimeType);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      const mimeType = getMimeType();
      let result;
      
      if (mimeType === 'image/gif' && originalFile) {
        // Try animated GIF processing first
        try {
          console.log('Attempting animated GIF processing...');
          result = await getCroppedGif(originalFile, croppedAreaPixels);
        } catch (gifError: any) {
          console.warn('Animated GIF processing failed, falling back to static crop:', gifError);
          // Fallback to static crop if animated processing fails
          alert('Could not preserve animation. Cropping as static GIF instead.');
          result = await getCroppedImg(image, croppedAreaPixels, mimeType);
        }
      } else {
        // Regular image processing
        result = await getCroppedImg(image, croppedAreaPixels, mimeType);
      }
      
      onCropComplete(result.url, result.mimeType);
    } catch (error: any) {
      console.error("Error cropping image:", error);
      setProcessingGif(false);
      alert(`Error cropping image: ${error.message || 'Unknown error'}. Please try again or use a different image.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 w-full max-w-2xl">
        <div className="p-4 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white">Crop Profile Picture</h2>
          <p className="text-sm text-zinc-400 mt-1">Drag to reposition, use slider to zoom</p>
          {isGif && !processingGif && (
            <p className="text-sm text-green-400 mt-2">
              ✨ Animated GIF detected - animation will be preserved!
            </p>
          )}
          {processingGif && (
            <p className="text-sm text-blue-400 mt-2">
              ⏳ Processing animated GIF frames... This may take a moment.
            </p>
          )}
        </div>
        
        <div className="relative w-full h-96 bg-zinc-800">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <div className="p-4 border-t border-zinc-700">
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              disabled={processingGif}
              className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={processingGif}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingGif ? "Processing GIF..." : isGif ? "Crop (Preserves Animation)" : "Save Cropped Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

