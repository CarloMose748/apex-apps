/**
 * Mobile-friendly file download utilities for webview environments like Median.co
 */

// Check if we're in a mobile webview
export const isMobileWebview = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isWebView = !window.location.href.includes('localhost') && !window.location.href.includes('127.0.0.1');
  
  return (isIOS || isAndroid) && isWebView;
};

// Check for Median.co specific environment
export const isMedianApp = (): boolean => {
  // @ts-ignore
  return typeof window.median !== 'undefined' || typeof window.gonative !== 'undefined';
};

// Request storage permission for mobile
export const requestStoragePermission = async (): Promise<boolean> => {
  try {
    // Check if we have Median.co native bridge
    // @ts-ignore
    if (window.median?.permissions) {
      // @ts-ignore
      const result = await window.median.permissions.request('storage');
      return result.granted;
    }
    
    // For other webviews, try navigator.storage.persist()
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const granted = await navigator.storage.persist();
      return granted;
    }
    
    // Fallback: assume permission granted
    return true;
  } catch (error) {
    console.warn('Storage permission request failed:', error);
    return true; // Optimistically assume permission
  }
};

// Download file with mobile webview support
export const downloadFile = async (
  blob: Blob, 
  filename: string, 
  mimeType: string = blob.type
): Promise<void> => {
  try {
    // Request permission first on mobile
    if (isMobileWebview()) {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Storage permission required for downloading files');
      }
    }

    // Try direct download first (best for saving files)
    try {
      const url = URL.createObjectURL(blob);
      
      // Always try direct download link method first
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up quickly
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      if (isMobileWebview()) {
        alert(`${filename} saved to Downloads!`);
      }
      
      return;
      
    } catch (error) {
      console.warn('Direct download failed, trying native methods:', error);
    }

    // Try Median.co native file saving (if available)
    if (isMedianApp()) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Try native download first (saves directly)
        // @ts-ignore
        if (window.median?.file?.saveFile) {
          // @ts-ignore
          await window.median.file.saveFile({
            data: base64,
            filename: filename,
            mimeType: mimeType
          });
          return;
        }
        
        // Try download API
        // @ts-ignore
        if (window.median?.share?.downloadFile) {
          // @ts-ignore
          await window.median.share.downloadFile({
            data: base64,
            filename: filename,
            mimeType: mimeType
          });
          return;
        }
        
      } catch (error) {
        console.warn('Median native save failed, trying other methods:', error);
      }
    }

    // If all native methods fail, try one more direct approach
    try {
      return await saveFileDirectly(blob, filename);
    } catch (error) {
      console.error('All download methods failed:', error);
      
      // Last resort: show user instructions for manual save
      const url = URL.createObjectURL(blob);
      
      // Copy URL to clipboard if possible
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          alert(`Download failed. URL copied to clipboard. Paste in browser to download: ${filename}`);
        } catch {
          alert(`Download failed. Please try again or contact support.`);
        }
      } else {
        alert(`Download failed. Please try again or contact support.`);
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    
  } catch (error) {
    console.error('File download failed:', error);
    throw error;
  }
};

// Force direct download without open option
export const forceDownload = async (
  blob: Blob,
  filename: string
): Promise<void> => {
  try {
    // Method 1: Use download attribute with immediate click (most direct)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Set attributes for forced download
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    // Add to DOM, click immediately, then remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up URL quickly
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    if (isMobileWebview()) {
      alert(`${filename} saved to Downloads folder!`);
    }
    
  } catch (error) {
    console.error('Force download failed:', error);
    
    // Fallback: try navigator.msSaveBlob for older browsers
    // @ts-ignore
    if (window.navigator.msSaveBlob) {
      // @ts-ignore
      window.navigator.msSaveBlob(blob, filename);
      return;
    }
    
    throw error;
  }
};

// Alternative save method that bypasses browser open dialog
export const saveFileDirectly = async (
  blob: Blob,
  filename: string
): Promise<void> => {
  try {
    // Create a temporary URL
    const url = URL.createObjectURL(blob);
    
    // Create link element with download attribute
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Force the download behavior
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Add to page, trigger download, remove immediately
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Direct save failed:', error);
    throw error;
  }
};

// Show download progress for better UX
export const showDownloadProgress = (filename: string): (() => void) => {
  const progressElement = document.createElement('div');
  progressElement.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 10000;
      text-align: center;
      font-family: Arial, sans-serif;
    ">
      <div>Generating ${filename}...</div>
      <div style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
        Please wait while we prepare your certificate
      </div>
    </div>
  `;
  document.body.appendChild(progressElement);

  return () => {
    if (progressElement.parentNode) {
      progressElement.parentNode.removeChild(progressElement);
    }
  };
};