// src/utils/crypto.utils.ts
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';

export class CryptoUtils {
  // Generate secure random string
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate UUID v4
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  // Hash a string using SHA-256
  static hashSHA256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Hash a file
  static hashFile(filePath: string): string {
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);
    return this.hashSHA256(fileBuffer);
  }

  // Create HMAC signature
  static createHMAC(data: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }

  // Verify HMAC signature
  static verifyHMAC(data: string, signature: string, secret: string, algorithm: string = 'sha256'): boolean {
    const expectedSignature = this.createHMAC(data, secret, algorithm);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  // Encrypt data using AES-256-GCM
  static encrypt(text: string, password: string): { encrypted: string; iv: string; tag: string } {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('999Plus', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Decrypt data using AES-256-GCM
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, password: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(password, 'salt', 32);
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('999Plus', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Password utilities
  static async hashPassword(password: string, saltRounds: number = 12): Promise<string> {
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // JWT utilities
  static generateJWT(payload: any, secret: string, expiresIn: string = '7d'): string {
    return jwt.sign(payload, secret, { expiresIn });
  }

  static verifyJWT(token: string, secret: string): any {
    return jwt.verify(token, secret);
  }

  static decodeJWT(token: string): any {
    return jwt.decode(token);
  }

  // Ethereum utilities
  static isValidEthAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static isValidEthPrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  static getAddressFromPrivateKey(privateKey: string): string {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  }

  // Generate case reference
  static generateCaseRef(): string {
    const timestamp = Date.now();
    const random = this.generateRandomString(2).toUpperCase();
    return `999P-${timestamp}-${random}`;
  }

  // Generate API key
  static generateAPIKey(): string {
    const prefix = '999p';
    const randomPart = this.generateRandomString(32);
    return `${prefix}_${randomPart}`;
  }

  // Create secure token for password reset, email verification, etc.
  static generateSecureToken(length: number = 48): string {
    return this.generateRandomString(length);
  }

  // Create webhook signature
  static createWebhookSignature(payload: string, secret: string): string {
    return `sha256=${this.createHMAC(payload, secret)}`;
  }

  // Verify webhook signature
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createWebhookSignature(payload, secret);
    return signature === expectedSignature;
  }

  // Generate document integrity proof
  static generateDocumentProof(documentHash: string, timestamp: number, userID: string): string {
    const data = `${documentHash}:${timestamp}:${userID}`;
    return this.hashSHA256(data);
  }

  // Verify document integrity proof
  static verifyDocumentProof(documentHash: string, timestamp: number, userID: string, proof: string): boolean {
    const expectedProof = this.generateDocumentProof(documentHash, timestamp, userID);
    return proof === expectedProof;
  }
}

// ===================================================

// src/utils/pdf.utils.ts
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export class PDFUtils {
  // Create a new PDF document
  static async createPDF(): Promise<PDFDocument> {
    return await PDFDocument.create();
  }

  // Load existing PDF
  static async loadPDF(filePath: string): Promise<PDFDocument> {
    const pdfBytes = fs.readFileSync(filePath);
    return await PDFDocument.load(pdfBytes);
  }

  // Save PDF to file
  static async savePDF(pdfDoc: PDFDocument, filePath: string): Promise<void> {
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
  }

  // Get PDF as buffer
  static async getPDFBuffer(pdfDoc: PDFDocument): Promise<Buffer> {
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // Add page to PDF
  static addPage(pdfDoc: PDFDocument, width: number = 595.28, height: number = 841.89): PDFPage {
    return pdfDoc.addPage([width, height]); // A4 size by default
  }

  // Add text to page
  static async addText(
    page: PDFPage,
    text: string,
    options: {
      x: number;
      y: number;
      size?: number;
      font?: PDFFont;
      color?: any;
      maxWidth?: number;
    }
  ): Promise<void> {
    const font = options.font || await page.doc.embedFont(StandardFonts.Helvetica);
    const size = options.size || 12;
    const color = options.color || rgb(0, 0, 0);

    if (options.maxWidth) {
      const wrappedText = this.wrapText(text, font, size, options.maxWidth);
      let currentY = options.y;
      
      for (const line of wrappedText) {
        page.drawText(line, {
          x: options.x,
          y: currentY,
          size,
          font,
          color
        });
        currentY -= size * 1.2; // Line spacing
      }
    } else {
      page.drawText(text, {
        x: options.x,
        y: options.y,
        size,
        font,
        color
      });
    }
  }

  // Wrap text to fit within specified width
  static wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  // Add header to PDF
  static async addHeader(
    page: PDFPage,
    title: string,
    options?: {
      fontSize?: number;
      y?: number;
      centerX?: boolean;
    }
  ): Promise<void> {
    const font = await page.doc.embedFont(StandardFonts.HelveticaBold);
    const size = options?.fontSize || 16;
    const y = options?.y || 800;
    
    let x = 50;
    if (options?.centerX) {
      const textWidth = font.widthOfTextAtSize(title, size);
      x = (page.getWidth() - textWidth) / 2;
    }

    page.drawText(title, {
      x,
      y,
      size,
      font,
      color: rgb(0, 0, 0)
    });
  }

  // Add footer to PDF
  static async addFooter(
    page: PDFPage,
    footerText: string,
    options?: {
      fontSize?: number;
      y?: number;
      centerX?: boolean;
    }
  ): Promise<void> {
    const font = await page.doc.embedFont(StandardFonts.Helvetica);
    const size = options?.fontSize || 10;
    const y = options?.y || 30;
    
    let x = 50;
    if (options?.centerX) {
      const textWidth = font.widthOfTextAtSize(footerText, size);
      x = (page.getWidth() - textWidth) / 2;
    }

    page.drawText(footerText, {
      x,
      y,
      size,
      font,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  // Add watermark to PDF
  static async addWatermark(
    page: PDFPage,
    watermarkText: string,
    options?: {
      fontSize?: number;
      opacity?: number;
      angle?: number;
    }
  ): Promise<void> {
    const font = await page.doc.embedFont(StandardFonts.HelveticaBold);
    const size = options?.fontSize || 48;
    const opacity = options?.opacity || 0.1;
    const angle = options?.angle || -45;

    const textWidth = font.widthOfTextAtSize(watermarkText, size);
    const x = (page.getWidth() - textWidth) / 2;
    const y = page.getHeight() / 2;

    page.drawText(watermarkText, {
      x,
      y,
      size,
      font,
      color: rgb(0.8, 0.8, 0.8),
      opacity,
      rotate: {
        type: 'degrees',
        angle
      }
    });
  }

  // Fill form fields in PDF
  static async fillFormFields(pdfDoc: PDFDocument, fieldData: { [key: string]: string }): Promise<void> {
    const form = pdfDoc.getForm();
    
    for (const [fieldName, value] of Object.entries(fieldData)) {
      try {
        const field = form.getTextField(fieldName);
        field.setText(value);
      } catch (error) {
        console.warn(`Field ${fieldName} not found in form`);
      }
    }
  }

  // Flatten form (make it non-editable)
  static flattenForm(pdfDoc: PDFDocument): void {
    const form = pdfDoc.getForm();
    form.flatten();
  }

  // Add signature field placeholder
  static async addSignatureField(
    page: PDFPage,
    signatureName: string,
    signatureDate: string,
    options: {
      x: number;
      y: number;
      width?: number;
    }
  ): Promise<void> {
    const font = await page.doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await page.doc.embedFont(StandardFonts.HelveticaBold);
    const width = options.width || 200;

    // Draw signature line
    page.drawLine({
      start: { x: options.x, y: options.y },
      end: { x: options.x + width, y: options.y },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    // Add signature text
    page.drawText('Signed:', {
      x: options.x,
      y: options.y + 20,
      size: 10,
      font: boldFont
    });

    page.drawText(signatureName, {
      x: options.x + 50,
      y: options.y + 20,
      size: 10,
      font
    });

    // Add date
    page.drawText('Date:', {
      x: options.x + width - 80,
      y: options.y + 20,
      size: 10,
      font: boldFont
    });

    page.drawText(signatureDate, {
      x: options.x + width - 40,
      y: options.y + 20,
      size: 10,
      font
    });
  }

  // Create legal document template
  static async createLegalDocumentTemplate(
    title: string,
    courtName?: string
  ): Promise<{ pdfDoc: PDFDocument; page: PDFPage }> {
    const pdfDoc = await this.createPDF();
    const page = this.addPage(pdfDoc);

    // Add header
    await this.addHeader(page, title, { centerX: true });

    // Add court name if provided
    if (courtName) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(`Court: ${courtName}`, {
        x: 50,
        y: 750,
        size: 12,
        font
      });
    }

    // Add footer with generation info
    const footerText = `Generated by 999Plus Platform - ${new Date().toLocaleDateString()}`;
    await this.addFooter(page, footerText, { centerX: true });

    return { pdfDoc, page };
  }

  // Get PDF metadata
  static getPDFInfo(pdfDoc: PDFDocument): any {
    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate()
    };
  }

  // Set PDF metadata
  static setPDFMetadata(pdfDoc: PDFDocument, metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
  }): void {
    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.creator) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer) pdfDoc.setProducer(metadata.producer);
    
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
  }
}

// ===================================================