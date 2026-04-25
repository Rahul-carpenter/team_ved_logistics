/**
 * Upload a photo to Google Drive via a Google Apps Script Web App.
 * This runs on the server (Next.js API) to avoid any browser issues.
 */
export async function uploadToGoogleDrive(base64Data, fileName) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  
  if (!scriptUrl) {
    console.warn('GOOGLE_SCRIPT_URL not set in .env — skipping Drive upload');
    return null;
  }

  try {
    // Extract mime type (e.g. image/jpeg)
    const matches = base64Data.match(/^data:([^;]+);base64,/);
    const mimeType = matches ? matches[1] : 'image/jpeg';

    // Call the Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64: base64Data,
        fileName: fileName,
        mimeType: mimeType
      })
    });

    if (!response.ok) {
      throw new Error(`Google Script returned status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        fileId: result.fileId,
        webViewLink: result.viewUrl,
        directLink: result.directLink
      };
    } else {
      console.error('Google Script Error:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Google Drive Upload Failed:', error.message);
    return null;
  }
}
