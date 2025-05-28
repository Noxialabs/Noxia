// src/controllers/document.controller.ts
import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';
import { asyncHandler } from '../middleware/error.middleware';
import { APIResponse } from '../types';
import { logger } from '../utils/logger.utils';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../storage/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExtension} is not allowed`));
    }
  }
});

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  generateForm = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { formType, formData, caseId } = req.body;

    if (!formType || !formData) {
      return res.status(400).json({
        success: false,
        message: 'Form type and form data are required'
      } as APIResponse);
    }

    const document = await this.documentService.generateForm(formType, formData, {
      userId,
      caseId
    });

    logger.info(`Form generated: ${formType} for user ${userId}`);

    res.json({
      success: true,
      message: 'Form generated successfully',
      data: document
    } as APIResponse);
  });

  uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    const uploadMiddleware = upload.single('document');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        } as APIResponse);
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        } as APIResponse);
      }

      const userId = (req as any).userId;
      const { caseId, documentType } = req.body;

      const document = await this.documentService.saveDocument({
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        caseId,
        documentType,
        userId
      });

      logger.info(`Document uploaded: ${req.file.filename} by user ${userId}`);

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      } as APIResponse);
    });
  });

  getDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const documentId = req.params.id;

    const document = await this.documentService.getDocument(documentId, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      } as APIResponse);
    }

    res.json({
      success: true,
      data: document
    } as APIResponse);
  });

  downloadDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const documentId = req.params.id;

    const document = await this.documentService.getDocument(documentId, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      } as APIResponse);
    }

    // Check if file exists
    const filePath = path.resolve(document.filePath);
    
    res.download(filePath, document.fileName, (err) => {
      if (err) {
        logger.error(`Error downloading document ${documentId}:`, err);
        res.status(500).json({
          success: false,
          message: 'Error downloading document'
        } as APIResponse);
      } else {
        logger.info(`Document downloaded: ${documentId} by user ${userId}`);
      }
    });
  });

  getDocuments = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const caseId = req.query.caseId as string;
    const documentType = req.query.documentType as string;

    const filters = {
      userId,
      ...(caseId && { caseId }),
      ...(documentType && { documentType })
    };

    const { documents, total } = await this.documentService.getDocuments(filters, page, limit);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    } as APIResponse);
  });

  deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const documentId = req.params.id;

    const deleted = await this.documentService.deleteDocument(documentId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      } as APIResponse);
    }

    logger.info(`Document deleted: ${documentId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    } as APIResponse);
  });

  getQRCode = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const documentId = req.params.id;

    const qrCode = await this.documentService.getDocumentQRCode(documentId, userId);

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found for this document'
      } as APIResponse);
    }

    res.json({
      success: true,
      data: qrCode
    } as APIResponse);
  });

  generateQRCode = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const documentId = req.params.id;

    const qrCode = await this.documentService.generateDocumentQRCode(documentId, userId);

    logger.info(`QR code generated for document: ${documentId}`);

    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: qrCode
    } as APIResponse);
  });

  getDocumentStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    const stats = await this.documentService.getDocumentStats(userId);

    res.json({
      success: true,
      data: stats
    } as APIResponse);
  });

  previewDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const documentId = req.params.id;

    const document = await this.documentService.getDocument(documentId, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      } as APIResponse);
    }

    // Generate preview (for PDFs, images, etc.)
    const preview = await this.documentService.generatePreview(document);

    res.json({
      success: true,
      data: {
        documentId,
        preview,
        documentInfo: {
          fileName: document.fileName,
          documentType: document.documentType,
          createdAt: document.createdAt
        }
      }
    } as APIResponse);
  });
}