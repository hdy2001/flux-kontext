"use client";

import React, { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";

const JewelleryPhotoEditor = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size cannot exceed 5MB");
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Reset processed image
      setProcessedImage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size cannot exceed 5MB");
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setProcessedImage(null);
    }
  };

  const processImage = async () => {
    if (!selectedImage) {
      toast.error("Please upload an image first");
      return;
    }

    // Check if API key is configured
    if (!process.env.NEXT_PUBLIC_REMOVE_API_KEY) {
      toast.error("API key not configured. Please check your environment variables.");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create FormData object
      const formData = new FormData();
      
      // Add image file
      formData.append('image_file', selectedImage);
      
      // Add other parameters based on Python code parameters
      formData.append('image_url', ''); // set image_url to empty
      formData.append('sync', '1');
      formData.append('type', '');
      formData.append('return_type', '2');
      formData.append('output_type', '2');
      formData.append('crop', '0');
      formData.append('format', 'png');
      formData.append('bg_color', '');
      formData.append('callback_url', '');

      // Send request to API
      const response = await fetch('https://api.gpt.ge/task/pic/segmentation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_REMOVE_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Check API response
      if (result.data && result.data.image) {
        // Convert base64 image data to data URL
        const processedImageData = `data:image/png;base64,${result.data.image}`;
        setProcessedImage(processedImageData);
        toast.success("Background removal completed!");
      } else {
        throw new Error('API returned incorrect data format');
      }
      
    } catch (error) {
      console.error("Processing failed:", error);
      toast.error("Processing failed, please try again");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `processed-jewellery-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Image download started!");
  };

  const resetEditor = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setProcessedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {!imagePreview ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-4">
            <div className="text-6xl">💎</div>
            <h3 className="text-xl font-semibold">Upload Jewellery Image</h3>
            <p className="text-gray-600">
              Click this area or drag and drop an image here
              <br />
              Supports JPG, PNG, WEBP formats, maximum 5MB
            </p>
            <div className="flex justify-center">
              <button className="btn btn-primary">
                Select Image
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Original image */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">Original</h3>
            <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={imagePreview}
                alt="Original image"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Processed image or processing button */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">
              {processedImage ? "Processed Result" : "AI Processing"}
            </h3>
            
            {!processedImage ? (
              <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-4xl">✨</div>
                  <p className="text-gray-600">AI background removed image will appear here</p>
                  <button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="btn btn-primary btn-lg"
                  >
                    {isProcessing ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        AI Processing...
                      </>
                    ) : (
                      "Start Processing"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={processedImage}
                  alt="Processed result"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {imagePreview && (
        <div className="flex justify-center space-x-4 pt-6">
          <button
            onClick={resetEditor}
            className="btn btn-outline"
          >
            Start Over
          </button>
          
          {processedImage && (
            <button
              onClick={downloadImage}
              className="btn btn-success"
            >
              Download HD Image
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default JewelleryPhotoEditor; 