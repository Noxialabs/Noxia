import { ethers } from 'ethers';
import crypto from 'crypto';
import fs from 'fs';
import QRCode from 'qrcode';
import path from 'path';
import { query } from '../database/connection';
import { logger } from '../utils/logger.utils';
import { v4 as uuidv4 } from 'uuid';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;
  private contract?: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    if (process.env.ETH_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, this.provider);
    }

    // Simple document registry contract ABI
        // Simple document registry contract ABI
    const contractABI = [
      "function registerDocument(bytes32 hash) public",
      "function getDocument(bytes32 hash) public view returns (address, uint256)",
      "event DocumentRegistered(bytes32 indexed hash, address indexed sender, uint256 timestamp)"
    ];

    /* if (process.env.CONTRACT_ADDRESS && this.wallet) {
      this.contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        contractABI,
        this.wallet
      );
    } */
  }

  async getUserTier(userId: string, ethAddress: string): Promise<any> {
    try {
      // Check if we have cached tier info
      const existingTier = await query(
        'SELECT * FROM user_tiers WHERE user_id = $1 AND eth_address = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, ethAddress]
      );

      // If tier was checked recently (within 1 hour), return cached result
      if (existingTier.rows.length > 0) {
        const lastCheck = new Date(existingTier.rows[0].last_balance_check);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastCheck > hourAgo) {
          return {
            userId,
            ethAddress,
            tier: existingTier.rows[0].tier,
            balance: parseFloat(existingTier.rows[0].eth_balance),
            lastChecked: lastCheck,
            cached: true
          };
        }
      }

      // Fetch fresh balance from blockchain
      const balance = await this.getWalletBalance(ethAddress);
      const tier = this.determineTierFromBalance(balance);

      // Update tier in database
      await this.saveTierInfo(userId, ethAddress, tier, balance);

      return {
        userId,
        ethAddress,
        tier,
        balance,
        lastChecked: new Date(),
        cached: false
      };
    } catch (error) {
      logger.error('Error getting user tier:', error);
      
      // Return default tier on error
      return {
        userId,
        ethAddress,
        tier: 'Tier 1',
        balance: 0,
        error: error.message,
        lastChecked: new Date()
      };
    }
  }

  async updateUserTier(userId: string, ethAddress: string): Promise<any> {
    const balance = await this.getWalletBalance(ethAddress);
    const tier = this.determineTierFromBalance(balance);

    await this.saveTierInfo(userId, ethAddress, tier, balance);

    // Update user's tier in users table
    await query(
      'UPDATE users SET tier = $1, updated_at = $2 WHERE id = $3',
      [tier, new Date(), userId]
    );

    logger.info(`Tier updated for user ${userId}: ${tier} (${balance} ETH)`);

    return {
      userId,
      ethAddress,
      tier,
      balance,
      updated: true
    };
  }

  async getWalletBalance(ethAddress: string): Promise<number> {
    try {
      const balance = await this.provider.getBalance(ethAddress);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      logger.error(`Error getting balance for ${ethAddress}:`, error);
      return 0;
    }
  }

  determineTierFromBalance(balance: number): string {
    if (balance >= 10) return 'Tier 4';
    if (balance >= 5) return 'Tier 3';
    if (balance >= 1) return 'Tier 2';
    return 'Tier 1';
  }

  async hashDocument(filePath: string, metadata?: any): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      logger.info(`Document hashed: ${hash}`);

      return {
        hash,
        filePath,
        fileSize: fileBuffer.length,
        hashedAt: new Date().toISOString(),
        metadata
      };
    } catch (error) {
      logger.error('Error hashing document:', error);
      throw new Error('Failed to hash document');
    }
  }

  async registerHashOnChain(
    documentHash: string,
    metadata?: {
      documentId?: string;
      caseId?: string;
      userId?: string;
    }
  ): Promise<any> {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized');
    }

    try {
      const hashBytes = '0x' + documentHash;
      
      // Estimate gas
      const gasEstimate = await this.contract.registerDocument.estimateGas(hashBytes);
      
      // Send transaction
      const tx = await this.contract.registerDocument(hashBytes, {
        gasLimit: gasEstimate * BigInt(2) // Add buffer
      });

      logger.info(`Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      // Save transaction to database
      const transactionId = uuidv4();
      await query(
        `INSERT INTO blockchain_transactions (
          id, document_id, case_id, tx_hash, document_hash,
          block_number, gas_used, status, network, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          transactionId,
          metadata?.documentId || null,
          metadata?.caseId || null,
          tx.hash,
          documentHash,
          receipt.blockNumber,
          receipt.gasUsed?.toString(),
          'Confirmed',
          process.env.ETH_NETWORK || 'sepolia',
          new Date()
        ]
      );

      logger.info(`Document hash registered on blockchain: ${tx.hash}`);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        documentHash,
        explorerUrl: `https://${process.env.ETH_NETWORK || 'sepolia'}.etherscan.io/tx/${tx.hash}`,
        status: 'Confirmed'
      };
    } catch (error) {
      logger.error('Error registering hash on blockchain:', error);
      throw new Error('Failed to register document hash on blockchain');
    }
  }

  async verifyDocument(filePath: string, expectedHash?: string): Promise<any> {
    const actualHash = crypto.createHash('sha256')
      .update(fs.readFileSync(filePath))
      .digest('hex');

    const isValid = expectedHash ? actualHash === expectedHash : true;

    return {
      filePath,
      actualHash,
      expectedHash,
      isValid,
      verifiedAt: new Date().toISOString()
    };
  }

  async getTransactionStatus(txHash: string): Promise<any> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          txHash,
          status: 'Pending',
          found: false
        };
      }

      return {
        txHash,
        status: receipt.status === 1 ? 'Confirmed' : 'Failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        found: true
      };
    } catch (error) {
      logger.error(`Error getting transaction status for ${txHash}:`, error);
      return {
        txHash,
        status: 'Error',
        error: error.message,
        found: false
      };
    }
  }

  async generateQRCode(data: {
    documentHash: string;
    txHash?: string;
    metadata?: any;
    generatedAt?: string;
  }): Promise<any> {
    const qrData = {
      documentHash: data.documentHash,
      txHash: data.txHash,
      explorerUrl: data.txHash ? 
        `https://${process.env.ETH_NETWORK || 'sepolia'}.etherscan.io/tx/${data.txHash}` : null,
      verifyUrl: `${process.env.APP_URL || 'http://localhost:3000'}/verify/${data.documentHash}`,
      generatedAt: data.generatedAt || new Date().toISOString(),
      metadata: data.metadata
    };

    const qrContent = JSON.stringify(qrData, null, 2);
    const fileName = `qr_${data.documentHash.substring(0, 8)}_${Date.now()}.png`;
    const filePath = path.join(__dirname, '../storage/qr_codes', fileName);

    await QRCode.toFile(filePath, qrContent, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    logger.info(`QR code generated: ${fileName}`);

    return {
      fileName,
      filePath,
      qrData,
      url: `/qr/${fileName}`
    };
  }

  async getBlockchainStats(userId?: string): Promise<any> {
    let whereClause = '';
    const values: any[] = [];

    if (userId) {
      whereClause = `
        WHERE blockchain_transactions.case_id IN (
          SELECT id FROM cases WHERE user_id = $1
        )
      `;
      values.push(userId);
    }

    const result = await query(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed_transactions,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'Failed' THEN 1 END) as failed_transactions,
        AVG(CAST(gas_used AS NUMERIC)) as avg_gas_used,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_transactions
      FROM blockchain_transactions
      ${whereClause}
    `, values);

    // Get tier distribution
    const tierStats = await query(`
      SELECT tier, COUNT(*) as count
      FROM user_tiers
      GROUP BY tier
      ORDER BY tier
    `);

    return {
      transactions: {
        total: parseInt(result.rows[0]?.total_transactions || '0'),
        confirmed: parseInt(result.rows[0]?.confirmed_transactions || '0'),
        pending: parseInt(result.rows[0]?.pending_transactions || '0'),
        failed: parseInt(result.rows[0]?.failed_transactions || '0'),
        avgGasUsed: parseFloat(result.rows[0]?.avg_gas_used || '0'),
        recent: parseInt(result.rows[0]?.recent_transactions || '0')
      },
      tiers: tierStats.rows.map(row => ({
        tier: row.tier,
        count: parseInt(row.count)
      }))
    };
  }

  private async saveTierInfo(
    userId: string,
    ethAddress: string,
    tier: string,
    balance: number
  ): Promise<void> {
    const id = uuidv4();
    await query(
      `INSERT INTO user_tiers (id, user_id, tier, eth_balance, eth_address, last_balance_check, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, tier, balance, ethAddress, new Date(), new Date()]
    );
  }
}
