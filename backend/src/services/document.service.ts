import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { query } from "../database/connection";
import { Document } from "../types";
import { logger } from "../utils/logger.utils";
import { v4 as uuidv4 } from "uuid";
import { BlockchainService } from "./blockchain.service";

export class DocumentService {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async generateForm(
    formType: string,
    formData: any,
    options?: {
      userId?: string;
      caseId?: string;
    }
  ): Promise<Document> {
    try {
      let filledDocument: Buffer;
      let fileName: string;

      switch (formType.toUpperCase()) {
        case "N240":
          filledDocument = await this.fillN240Form(formData);
          fileName = `N240_${Date.now()}.pdf`;
          break;
        case "N1":
          filledDocument = await this.fillN1Form(formData);
          fileName = `N1_${Date.now()}.pdf`;
          break;
        case "ET1":
          filledDocument = await this.fillET1Form(formData);
          fileName = `ET1_${Date.now()}.pdf`;
          break;
        default:
          throw new Error(`Unsupported form type: ${formType}`);
      }

      // Save file to storage
      const filePath = path.join(__dirname, "../storage/documents", fileName);
      fs.writeFileSync(filePath, filledDocument);

      // Generate hash
      const hashResult = await this.blockchainService.hashDocument(filePath);

      // Save document record
      const documentId = uuidv4();
      await query(
        `INSERT INTO documents (
          id, case_id, document_type, file_name, file_path, 
          file_hash, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          documentId,
          options?.caseId || null,
          formType.toUpperCase(),
          fileName,
          filePath,
          hashResult.hash,
          "Generated",
          new Date(),
        ]
      );

      logger.info(`Form generated: ${formType} - ${fileName}`);

      return {
        id: documentId,
        caseId: options?.caseId || "",
        documentType: formType.toUpperCase() as any,
        fileName,
        filePath,
        fileHash: hashResult.hash,
        status: "Generated",
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error(`Error generating ${formType} form:`, error);
      throw new Error(`Failed to generate ${formType} form`);
    }
  }

  async fillN240Form(formData: {
    courtName: string;
    caseNumber: string;
    claimantName: string;
    defendantName: string;
    requestDetails: string;
    signatureName: string;
    signatureDate: string;
  }): Promise<Buffer> {
    // Create a new PDF document (simplified example)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header
    page.drawText("Form N240 - Application Notice", {
      x: 50,
      y: 800,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Court Name
    page.drawText("Court:", { x: 50, y: 750, size: 12, font: boldFont });
    page.drawText(formData.courtName, { x: 120, y: 750, size: 12, font });

    // Case Number
    page.drawText("Case Number:", { x: 50, y: 720, size: 12, font: boldFont });
    page.drawText(formData.caseNumber, { x: 150, y: 720, size: 12, font });

    // Claimant
    page.drawText("Claimant:", { x: 50, y: 690, size: 12, font: boldFont });
    page.drawText(formData.claimantName, { x: 120, y: 690, size: 12, font });

    // Defendant
    page.drawText("Defendant:", { x: 50, y: 660, size: 12, font: boldFont });
    page.drawText(formData.defendantName, { x: 130, y: 660, size: 12, font });

    // Request Details
    page.drawText("Application Details:", {
      x: 50,
      y: 600,
      size: 12,
      font: boldFont,
    });
    const requestLines = this.wrapText(formData.requestDetails, 70);
    requestLines.forEach((line, index) => {
      page.drawText(line, { x: 50, y: 570 - index * 15, size: 10, font });
    });

    // Signature
    const signatureY = 570 - requestLines.length * 15 - 50;
    page.drawText("Signed:", {
      x: 50,
      y: signatureY,
      size: 12,
      font: boldFont,
    });
    page.drawText(formData.signatureName, {
      x: 110,
      y: signatureY,
      size: 12,
      font,
    });
    page.drawText("Date:", { x: 300, y: signatureY, size: 12, font: boldFont });
    page.drawText(formData.signatureDate, {
      x: 340,
      y: signatureY,
      size: 12,
      font,
    });

    return Buffer.from(await pdfDoc.save());
  }

  async fillN1Form(formData: {
    courtName: string;
    claimantName: string;
    claimantAddress: string;
    defendantName: string;
    defendantAddress: string;
    claimAmount: string;
    claimDetails: string;
    signatureName: string;
    signatureDate: string;
  }): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header
    page.drawText("Form N1 - Claim Form", {
      x: 50,
      y: 800,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    let yPosition = 750;

    // Court
    page.drawText("Court:", { x: 50, y: yPosition, size: 12, font: boldFont });
    page.drawText(formData.courtName, { x: 120, y: yPosition, size: 12, font });
    yPosition -= 30;

    // Claimant details
    page.drawText("Claimant:", {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    page.drawText(formData.claimantName, {
      x: 120,
      y: yPosition,
      size: 12,
      font,
    });
    yPosition -= 20;

    const claimantAddressLines = this.wrapText(formData.claimantAddress, 60);
    claimantAddressLines.forEach((line) => {
      page.drawText(line, { x: 120, y: yPosition, size: 10, font });
      yPosition -= 15;
    });

    yPosition -= 10;

    // Defendant details
    page.drawText("Defendant:", {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    page.drawText(formData.defendantName, {
      x: 130,
      y: yPosition,
      size: 12,
      font,
    });
    yPosition -= 20;

    const defendantAddressLines = this.wrapText(formData.defendantAddress, 60);
    defendantAddressLines.forEach((line) => {
      page.drawText(line, { x: 130, y: yPosition, size: 10, font });
      yPosition -= 15;
    });

    yPosition -= 20;

    // Claim amount
    page.drawText("Claim Amount:", {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    page.drawText(`£${formData.claimAmount}`, {
      x: 160,
      y: yPosition,
      size: 12,
      font,
    });
    yPosition -= 30;

    // Claim details
    page.drawText("Details of Claim:", {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    yPosition -= 20;

    const claimLines = this.wrapText(formData.claimDetails, 70);
    claimLines.forEach((line) => {
      page.drawText(line, { x: 50, y: yPosition, size: 10, font });
      yPosition -= 15;
    });

    yPosition -= 30;

    // Signature
    page.drawText("Signed:", { x: 50, y: yPosition, size: 12, font: boldFont });
    page.drawText(formData.signatureName, {
      x: 110,
      y: yPosition,
      size: 12,
      font,
    });
    page.drawText("Date:", { x: 300, y: yPosition, size: 12, font: boldFont });
    page.drawText(formData.signatureDate, {
      x: 340,
      y: yPosition,
      size: 12,
      font,
    });

    return Buffer.from(await pdfDoc.save());
  }

  async fillET1Form(formData: {
    claimantName: string;
    claimantAddress: string;
    respondentName: string;
    respondentAddress: string;
    employmentDetails: string;
    claimDetails: string;
    signatureName: string;
    signatureDate: string;
  }): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header
    page.drawText("Form ET1 - Employment Tribunal Claim", {
      x: 50,
      y: 800,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    let yPosition = 750;

    // Claimant details
    page.drawText("Claimant Details:", {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    yPosition -= 20;
    page.drawText(formData.claimantName, {
      x: 50,
      y: yPosition,
      size: 12,
      font,
    });
    yPosition -= 15;

    const claimantAddressLines = this.wrapText(formData.claimantAddress, 60);
    claimantAddressLines.forEach((line) => {
      page.drawText(line, { x: 50, y: yPosition, size: 10, font });
      yPosition -= 15;
    });

    yPosition -= 20;

    // Respondent details
    page.drawText("Respondent Details:", {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    yPosition -= 20;
    page.drawText(formData.respondentName, {
      x: 50,
      y: yPosition,
      size: 12,
      font,
    });
    yPosition -= 15;

    const respondentAddressLines = this.wrapText(
      formData.respondentAddress,
      60
    );
    respondentAddressLines.forEach((line) => {
      page.drawText(line, { x: 50, y: yPosition, size: 10, font });
      yPosition -= 15;
    });

    yPosition -= 20;

    // Employment details
    page.drawText("Employment Details:", {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    yPosition -= 15;
    const employmentLines = this.wrapText(formData.employmentDetails, 70);
    employmentLines.forEach((line) => {
      page.drawText(line, { x: 50, y: yPosition, size: 10, font });
      yPosition -= 15;
    });

    yPosition -= 20;

    // Claim details
    page.drawText("Details of Claim:", {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    yPosition -= 15;
    const claimLines = this.wrapText(formData.claimDetails, 70);
    claimLines.forEach((line) => {
      page.drawText(line, { x: 50, y: yPosition, size: 10, font });
      yPosition -= 15;
    });

    yPosition -= 30;

    // Signature
    page.drawText("Signed:", { x: 50, y: yPosition, size: 12, font: boldFont });
    page.drawText(formData.signatureName, {
      x: 110,
      y: yPosition,
      size: 12,
      font,
    });
    page.drawText("Date:", { x: 300, y: yPosition, size: 12, font: boldFont });
    page.drawText(formData.signatureDate, {
      x: 340,
      y: yPosition,
      size: 12,
      font,
    });

    return Buffer.from(await pdfDoc.save());
  }

  async saveDocument(documentData: {
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    caseId?: string;
    documentType?: string;
    userId?: string;
  }): Promise<Document> {
    const documentId = uuidv4();

    // Generate file hash
    const hashResult = await this.blockchainService.hashDocument(
      documentData.filePath
    );

    await query(
      `INSERT INTO documents (
        id, case_id, document_type, file_name, file_path, 
        file_hash, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        documentId,
        documentData.caseId || null,
        documentData.documentType || "Other",
        documentData.fileName,
        documentData.filePath,
        hashResult.hash,
        "Generated",
        new Date(),
      ]
    );

    logger.info(`Document saved: ${documentData.fileName}`);

    return {
      id: documentId,
      caseId: documentData.caseId || "",
      documentType: (documentData.documentType || "Other") as any,
      fileName: documentData.fileName,
      filePath: documentData.filePath,
      fileHash: hashResult.hash,
      status: "Generated",
      createdAt: new Date(),
    };
  }

  async getDocument(
    documentId: string,
    userId: string
  ): Promise<Document | null> {
    const result = await query(
      `SELECT d.* FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       WHERE d.id = $1 AND (c.user_id = $2 OR c.user_id IS NULL)`,
      [documentId, userId]
    );

    return result.rows.length > 0
      ? this.mapDatabaseDocument(result.rows[0])
      : null;
  }

  async getDocuments(
    filters: {
      userId: string;
      caseId?: string;
      documentType?: string;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ documents: Document[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE c.user_id = $1";
    const values: any[] = [filters.userId];
    let paramIndex = 2;

    if (filters.caseId) {
      whereClause += ` AND d.case_id = ${paramIndex}`;
      values.push(filters.caseId);
      paramIndex++;
    }

    if (filters.documentType) {
      whereClause += ` AND d.document_type = ${paramIndex}`;
      values.push(filters.documentType);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       ${whereClause}`,
      values
    );

    const documentsResult = await query(
      `SELECT d.* FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT ${paramIndex} OFFSET ${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      documents: documentsResult.rows.map((row) =>
        this.mapDatabaseDocument(row)
      ),
      total: parseInt(countResult.rows[0].count),
    };
  }

  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    // Check if document belongs to user
    const document = await this.getDocument(documentId, userId);
    if (!document) {
      return false;
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
    } catch (error) {
      logger.warn(`Failed to delete file: ${document.filePath}`, error);
    }

    // Delete from database
    await query("DELETE FROM documents WHERE id = $1", [documentId]);

    logger.info(`Document deleted: ${documentId}`);
    return true;
  }

  async getDocumentQRCode(documentId: string, userId: string): Promise<any> {
    const document = await this.getDocument(documentId, userId);
    if (!document) {
      return null;
    }

    // Check if QR code already exists
    if (document.qrCodePath && fs.existsSync(document.qrCodePath)) {
      return {
        documentId,
        qrCodePath: document.qrCodePath,
        exists: true,
      };
    }

    return null;
  }

  async generateDocumentQRCode(
    documentId: string,
    userId: string
  ): Promise<any> {
    const document = await this.getDocument(documentId, userId);
    if (!document) {
      throw new Error("Document not found");
    }

    const qrCode = await this.blockchainService.generateQRCode({
      documentHash: document.fileHash,
      metadata: {
        documentId: document.id,
        documentType: document.documentType,
        fileName: document.fileName,
        createdAt: document.createdAt,
      },
    });

    // Update document with QR code path
    await query("UPDATE documents SET qr_code_path = $1 WHERE id = $2", [
      qrCode.filePath,
      documentId,
    ]);

    return {
      documentId,
      qrCode,
      documentHash: document.fileHash,
    };
  }

  async getDocumentStats(userId: string): Promise<any> {
    const result = await query(
      `
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN d.document_type = 'N240' THEN 1 END) as n240_forms,
        COUNT(CASE WHEN d.document_type = 'N1' THEN 1 END) as n1_forms,
        COUNT(CASE WHEN d.document_type = 'ET1' THEN 1 END) as et1_forms,
        COUNT(CASE WHEN d.document_type = 'Other' THEN 1 END) as other_documents,
        COUNT(CASE WHEN d.status = 'Generated' THEN 1 END) as generated_documents,
        COUNT(CASE WHEN d.status = 'Verified' THEN 1 END) as verified_documents,
        COUNT(CASE WHEN d.qr_code_path IS NOT NULL THEN 1 END) as documents_with_qr,
        COUNT(CASE WHEN d.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_documents
      FROM documents d
      LEFT JOIN cases c ON d.case_id = c.id
      WHERE c.user_id = $1 OR c.user_id IS NULL
    `,
      [userId]
    );

    return {
      totalDocuments: parseInt(result.rows[0]?.total_documents || "0"),
      formTypes: {
        n240: parseInt(result.rows[0]?.n240_forms || "0"),
        n1: parseInt(result.rows[0]?.n1_forms || "0"),
        et1: parseInt(result.rows[0]?.et1_forms || "0"),
        other: parseInt(result.rows[0]?.other_documents || "0"),
      },
      statuses: {
        generated: parseInt(result.rows[0]?.generated_documents || "0"),
        verified: parseInt(result.rows[0]?.verified_documents || "0"),
      },
      documentsWithQR: parseInt(result.rows[0]?.documents_with_qr || "0"),
      recentDocuments: parseInt(result.rows[0]?.recent_documents || "0"),
    };
  }

  async generatePreview(document: Document): Promise<any> {
    try {
      const fileExtension = path.extname(document.fileName).toLowerCase();

      switch (fileExtension) {
        case ".pdf":
          return await this.generatePDFPreview(document);
        case ".jpg":
        case ".jpeg":
        case ".png":
          return await this.generateImagePreview(document);
        case ".doc":
        case ".docx":
          return await this.generateDocumentPreview(document);
        default:
          return {
            type: "unsupported",
            message: "Preview not available for this file type",
            fileName: document.fileName,
            fileSize: this.getFileSize(document.filePath),
          };
      }
    } catch (error) {
      logger.error(
        `Error generating preview for document ${document.id}:`,
        error
      );
      return {
        type: "error",
        message: "Failed to generate preview",
        error: error.message,
      };
    }
  }

  private async generatePDFPreview(document: Document): Promise<any> {
    try {
      const stats = fs.statSync(document.filePath);

      return {
        type: "pdf",
        fileName: document.fileName,
        fileSize: this.formatFileSize(stats.size),
        pages: "Unknown", // Would need PDF parsing library to get page count
        downloadUrl: `/api/documents/${document.id}/download`,
        viewUrl: `/api/documents/${document.id}/view`,
      };
    } catch (error) {
      throw new Error("Failed to generate PDF preview");
    }
  }

  private async generateImagePreview(document: Document): Promise<any> {
    try {
      const stats = fs.statSync(document.filePath);

      return {
        type: "image",
        fileName: document.fileName,
        fileSize: this.formatFileSize(stats.size),
        thumbnailUrl: `/api/documents/${document.id}/thumbnail`,
        downloadUrl: `/api/documents/${document.id}/download`,
      };
    } catch (error) {
      throw new Error("Failed to generate image preview");
    }
  }

  private async generateDocumentPreview(document: Document): Promise<any> {
    try {
      const stats = fs.statSync(document.filePath);

      return {
        type: "document",
        fileName: document.fileName,
        fileSize: this.formatFileSize(stats.size),
        downloadUrl: `/api/documents/${document.id}/download`,
        convertUrl: `/api/documents/${document.id}/convert/pdf`,
      };
    } catch (error) {
      throw new Error("Failed to generate document preview");
    }
  }

  async convertToPDF(documentId: string, userId: string): Promise<any> {
    const document = await this.getDocument(documentId, userId);
    if (!document) {
      throw new Error("Document not found");
    }

    const fileExtension = path.extname(document.fileName).toLowerCase();

    if (fileExtension === ".pdf") {
      return {
        message: "Document is already in PDF format",
        downloadUrl: `/api/documents/${document.id}/download`,
      };
    }

    // For now, return a placeholder - would need actual conversion logic
    return {
      message: "PDF conversion not yet implemented for this file type",
      supportedFormats: [".pdf"],
      currentFormat: fileExtension,
    };
  }

  async duplicateDocument(
    documentId: string,
    userId: string
  ): Promise<Document> {
    const originalDocument = await this.getDocument(documentId, userId);
    if (!originalDocument) {
      throw new Error("Document not found");
    }

    // Read original file
    const originalContent = fs.readFileSync(originalDocument.filePath);

    // Create new filename
    const timestamp = Date.now();
    const fileExtension = path.extname(originalDocument.fileName);
    const baseName = path.basename(originalDocument.fileName, fileExtension);
    const newFileName = `${baseName}_copy_${timestamp}${fileExtension}`;
    const newFilePath = path.join(
      path.dirname(originalDocument.filePath),
      newFileName
    );

    // Write new file
    fs.writeFileSync(newFilePath, originalContent);

    // Generate hash for new file
    const hashResult = await this.blockchainService.hashDocument(newFilePath);

    // Create new document record
    const newDocumentId = uuidv4();
    await query(
      `INSERT INTO documents (
        id, case_id, document_type, file_name, file_path, 
        file_hash, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        newDocumentId,
        originalDocument.caseId,
        originalDocument.documentType,
        newFileName,
        newFilePath,
        hashResult.hash,
        "Generated",
        new Date(),
      ]
    );

    logger.info(
      `Document duplicated: ${originalDocument.id} -> ${newDocumentId}`
    );

    return {
      id: newDocumentId,
      caseId: originalDocument.caseId,
      documentType: originalDocument.documentType,
      fileName: newFileName,
      filePath: newFilePath,
      fileHash: hashResult.hash,
      status: "Generated",
      createdAt: new Date(),
    };
  }

  async getDocumentHistory(documentId: string, userId: string): Promise<any[]> {
    const document = await this.getDocument(documentId, userId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Get blockchain transactions for this document
    const transactions = await query(
      "SELECT * FROM blockchain_transactions WHERE document_id = $1 ORDER BY created_at DESC",
      [documentId]
    );

    // Get document access logs (if you implement logging)
    const accessLogs = await query(
      `SELECT 'download' as action, created_at, 'system' as user_id
       FROM audit_logs 
       WHERE details->>'documentId' = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [documentId]
    );

    return [
      {
        action: "created",
        timestamp: document.createdAt,
        details: {
          fileName: document.fileName,
          documentType: document.documentType,
        },
      },
      ...transactions.rows.map((tx) => ({
        action: "blockchain_registered",
        timestamp: tx.created_at,
        details: {
          txHash: tx.tx_hash,
          blockNumber: tx.block_number,
          status: tx.status,
        },
      })),
      ...accessLogs.rows.map((log) => ({
        action: log.action,
        timestamp: log.created_at,
        details: {},
      })),
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async searchDocuments(
    userId: string,
    searchTerm: string,
    filters?: {
      documentType?: string;
      caseId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ documents: Document[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause =
      "WHERE c.user_id = $1 AND (d.file_name ILIKE $2 OR d.document_type ILIKE $2)";
    const values: any[] = [userId, `%${searchTerm}%`];
    let paramIndex = 3;

    if (filters?.documentType) {
      whereClause += ` AND d.document_type = $${paramIndex}`;
      values.push(filters.documentType);
      paramIndex++;
    }

    if (filters?.caseId) {
      whereClause += ` AND d.case_id = $${paramIndex}`;
      values.push(filters.caseId);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      whereClause += ` AND d.created_at >= $${paramIndex}`;
      values.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      whereClause += ` AND d.created_at <= $${paramIndex}`;
      values.push(filters.dateTo);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       ${whereClause}`,
      values
    );

    const documentsResult = await query(
      `SELECT d.* FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      documents: documentsResult.rows.map((row) =>
        this.mapDatabaseDocument(row)
      ),
      total: parseInt(countResult.rows[0].count),
    };
  }

  private getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? " " : "") + word;
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

  private mapDatabaseDocument(dbDocument: any): Document {
    return {
      id: dbDocument.id,
      caseId: dbDocument.case_id,
      documentType: dbDocument.document_type,
      fileName: dbDocument.file_name,
      filePath: dbDocument.file_path,
      fileHash: dbDocument.file_hash,
      blockchainTxHash: dbDocument.blockchain_tx_hash,
      qrCodePath: dbDocument.qr_code_path,
      status: dbDocument.status,
      createdAt: dbDocument.created_at,
    };
  }
}
