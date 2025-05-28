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