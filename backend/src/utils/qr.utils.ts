import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export class QRUtils {
  // Generate QR code as PNG file
  static async generateQRFile(
    data: string,
    filePath: string,
    options?: {
      width?: number;
      margin?: number;
      color?: {
        dark?: string;
        light?: string;
      };
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }
  ): Promise<string> {
    const qrOptions = {
      width: options?.width || 300,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
    };

    await QRCode.toFile(filePath, data, qrOptions);
    return filePath;
  }

  // Generate QR code as base64 string
  static async generateQRBase64(
    data: string,
    options?: {
      width?: number;
      margin?: number;
      color?: {
        dark?: string;
        light?: string;
      };
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }
  ): Promise<string> {
    const qrOptions = {
      width: options?.width || 300,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
    };

    return await QRCode.toDataURL(data, qrOptions);
  }

  // Generate QR code as SVG string
  static async generateQRSVG(
    data: string,
    options?: {
      width?: number;
      margin?: number;
      color?: {
        dark?: string;
        light?: string;
      };
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }
  ): Promise<string> {
    const qrOptions = {
      width: options?.width || 300,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      type: 'svg' as const
    };

    return await QRCode.toString(data, qrOptions);
  }

  // Generate document verification QR code
  static async generateDocumentQR(
    documentHash: string,
    txHash?: string,
    metadata?: any,
    outputPath?: string
  ): Promise<{ qrPath?: string; qrData: any; qrBase64: string }> {
    const qrData = {
      type: 'document_verification',
      documentHash,
      txHash,
      verifyUrl: `${process.env.APP_URL || 'http://localhost:3000'}/verify/${documentHash}`,
      explorerUrl: txHash ? 
        `https://${process.env.ETH_NETWORK || 'sepolia'}.etherscan.io/tx/${txHash}` : null,
      generatedAt: new Date().toISOString(),
      platform: '999Plus',
      metadata
    };

    const qrContent = JSON.stringify(qrData, null, 2);
    const qrBase64 = await this.generateQRBase64(qrContent, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    let qrPath: string | undefined;
    if (outputPath) {
      qrPath = await this.generateQRFile(qrContent, outputPath, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M'
      });
    }

    return {
      qrPath,
      qrData,
      qrBase64
    };
  }

  // Generate case reference QR code
  static async generateCaseQR(
    caseRef: string,
    caseId: string,
    metadata?: any,
    outputPath?: string
  ): Promise<{ qrPath?: string; qrData: any; qrBase64: string }> {
    const qrData = {
      type: 'case_reference',
      caseRef,
      caseId,
      viewUrl: `${process.env.APP_URL || 'http://localhost:3000'}/cases/${caseId}`,
      generatedAt: new Date().toISOString(),
      platform: '999Plus',
      metadata
    };

    const qrContent = JSON.stringify(qrData, null, 2);
    const qrBase64 = await this.generateQRBase64(qrContent, {
      width: 250,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    let qrPath: string | undefined;
    if (outputPath) {
      qrPath = await this.generateQRFile(qrContent, outputPath, {
        width: 250,
        margin: 2,
        errorCorrectionLevel: 'M'
      });
    }

    return {
      qrPath,
      qrData,
      qrBase64
    };
  }

  // Generate contact/profile QR code
  static async generateContactQR(
    contactInfo: {
      name: string;
      email?: string;
      phone?: string;
      organization?: string;
      url?: string;
    },
    outputPath?: string
  ): Promise<{ qrPath?: string; qrData: any; qrBase64: string }> {
    // vCard format for contact information
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${contactInfo.name}`,
      contactInfo.email ? `EMAIL:${contactInfo.email}` : '',
      contactInfo.phone ? `TEL:${contactInfo.phone}` : '',
      contactInfo.organization ? `ORG:${contactInfo.organization}` : '',
      contactInfo.url ? `URL:${contactInfo.url}` : '',
      'END:VCARD'
    ].filter(line => line !== '').join('\n');

    const qrBase64 = await this.generateQRBase64(vCard, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    let qrPath: string | undefined;
    if (outputPath) {
      qrPath = await this.generateQRFile(vCard, outputPath, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M'
      });
    }

    return {
      qrPath,
      qrData: { type: 'contact', vCard, contactInfo },
      qrBase64
    };
  }

  // Generate WiFi QR code
  static async generateWiFiQR(
    ssid: string,
    password: string,
    security: 'WPA' | 'WEP' | 'nopass' = 'WPA',
    outputPath?: string
  ): Promise<{ qrPath?: string; qrData: string; qrBase64: string }> {
    const wifiString = `WIFI:T:${security};S:${ssid};P:${password};;`;

    const qrBase64 = await this.generateQRBase64(wifiString, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    let qrPath: string | undefined;
    if (outputPath) {
      qrPath = await this.generateQRFile(wifiString, outputPath);
    }

    return {
      qrPath,
      qrData: wifiString,
      qrBase64
    };
  }

  // Generate URL QR code
  static async generateURLQR(
    url: string,
    outputPath?: string,
    options?: {
      width?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }
  ): Promise<{ qrPath?: string; qrData: string; qrBase64: string }> {
    const qrBase64 = await this.generateQRBase64(url, {
      width: options?.width || 200,
      margin: 2,
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
    });

    let qrPath: string | undefined;
    if (outputPath) {
      qrPath = await this.generateQRFile(url, outputPath, {
        width: options?.width || 200,
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
      });
    }

    return {
      qrPath,
      qrData: url,
      qrBase64
    };
  }

  // Generate batch QR codes
  static async generateBatchQR(
    dataList: string[],
    outputDir: string,
    options?: {
      prefix?: string;
      width?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }
  ): Promise<string[]> {
    const generatedFiles: string[] = [];
    const prefix = options?.prefix || 'qr';

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (let i = 0; i < dataList.length; i++) {
      const fileName = `${prefix}_${i + 1}.png`;
      const filePath = path.join(outputDir, fileName);
      
      await this.generateQRFile(dataList[i], filePath, {
        width: options?.width || 200,
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
      });
      
      generatedFiles.push(filePath);
    }

    return generatedFiles;
  }

  // Get QR code info/stats
  static getQRInfo(data: string): {
    length: number;
    estimatedSize: string;
    recommendedErrorCorrection: 'L' | 'M' | 'Q' | 'H';
  } {
    const length = data.length;
    let estimatedSize: string;
    let recommendedErrorCorrection: 'L' | 'M' | 'Q' | 'H';

    if (length < 100) {
      estimatedSize = 'Small';
      recommendedErrorCorrection = 'L';
    } else if (length < 500) {
      estimatedSize = 'Medium';
      recommendedErrorCorrection = 'M';
    } else if (length < 1000) {
      estimatedSize = 'Large';
      recommendedErrorCorrection = 'Q';
    } else {
      estimatedSize = 'Very Large';
      recommendedErrorCorrection = 'H';
    }

    return {
      length,
      estimatedSize,
      recommendedErrorCorrection
    };
  }

  // Validate QR data
  static validateQRData(data: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || data.trim().length === 0) {
      errors.push('Data cannot be empty');
    }

    if (data.length > 2953) { // Max capacity for QR code
      errors.push('Data exceeds maximum QR code capacity (2953 characters)');
    }

    // Check for potentially problematic characters
    const problematicChars = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g;
    if (problematicChars.test(data)) {
      errors.push('Data contains control characters that may cause issues');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
