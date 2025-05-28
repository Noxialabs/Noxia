import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain.service';
import { asyncHandler } from '../middleware/error.middleware';
import { APIResponse } from '../types';
import { logger } from '../utils/logger.utils';

export class BlockchainController {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  getTierInfo = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { ethAddress } = req.body;

    if (!ethAddress) {
      return res.status(400).json({
        success: false,
        message: 'Ethereum address is required'
      } as APIResponse);
    }

    const tierInfo = await this.blockchainService.getUserTier(userId, ethAddress);

    res.json({
      success: true,
      data: tierInfo
    } as APIResponse);
  });

  updateTier = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { ethAddress } = req.body;

    if (!ethAddress) {
      return res.status(400).json({
        success: false,
        message: 'Ethereum address is required'
      } as APIResponse);
    }

    const updatedTier = await this.blockchainService.updateUserTier(userId, ethAddress);

    logger.info(`Tier updated for user ${userId}: ${updatedTier.tier}`);

    res.json({
      success: true,
      message: 'Tier updated successfully',
      data: updatedTier
    } as APIResponse);
  });

  hashDocument = asyncHandler(async (req: Request, res: Response) => {
    const { documentPath, caseId, documentType } = req.body;

    if (!documentPath) {
      return res.status(400).json({
        success: false,
        message: 'Document path is required'
      } as APIResponse);
    }

    const hashResult = await this.blockchainService.hashDocument(documentPath, {
      caseId,
      documentType,
      userId: (req as any).userId
    });

    logger.info(`Document hashed: ${hashResult.hash}`);

    res.json({
      success: true,
      message: 'Document hashed successfully',
      data: hashResult
    } as APIResponse);
  });

  registerDocumentHash = asyncHandler(async (req: Request, res: Response) => {
    const { documentHash, documentId, caseId } = req.body;

    if (!documentHash) {
      return res.status(400).json({
        success: false,
        message: 'Document hash is required'
      } as APIResponse);
    }

    const transaction = await this.blockchainService.registerHashOnChain(documentHash, {
      documentId,
      caseId,
      userId: (req as any).userId
    });

    logger.info(`Document hash registered on blockchain: ${transaction.txHash}`);

    res.json({
      success: true,
      message: 'Document hash registered on blockchain',
      data: transaction
    } as APIResponse);
  });

  verifyDocument = asyncHandler(async (req: Request, res: Response) => {
    const { documentPath, expectedHash } = req.body;

    if (!documentPath) {
      return res.status(400).json({
        success: false,
        message: 'Document path is required'
      } as APIResponse);
    }

    const verification = await this.blockchainService.verifyDocument(documentPath, expectedHash);

    res.json({
      success: true,
      data: verification
    } as APIResponse);
  });

  getTransactionStatus = asyncHandler(async (req: Request, res: Response) => {
    const { txHash } = req.params;

    const status = await this.blockchainService.getTransactionStatus(txHash);

    res.json({
      success: true,
      data: status
    } as APIResponse);
  });

  getWalletBalance = asyncHandler(async (req: Request, res: Response) => {
    const { ethAddress } = req.params;

    const balance = await this.blockchainService.getWalletBalance(ethAddress);

    res.json({
      success: true,
      data: {
        address: ethAddress,
        balance,
        tier: this.blockchainService.determineTierFromBalance(balance)
      }
    } as APIResponse);
  });

  getBlockchainStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    const stats = await this.blockchainService.getBlockchainStats(userId);

    res.json({
      success: true,
      data: stats
    } as APIResponse);
  });

  generateQRCode = asyncHandler(async (req: Request, res: Response) => {
    const { documentHash, txHash, metadata } = req.body;

    if (!documentHash) {
      return res.status(400).json({
        success: false,
        message: 'Document hash is required'
      } as APIResponse);
    }

    const qrCode = await this.blockchainService.generateQRCode({
      documentHash,
      txHash,
      metadata,
      generatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: qrCode
    } as APIResponse);
  });
}
