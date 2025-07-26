import { getCurrentEnvironment } from '../config/environments';
import { monitoring } from './monitoring';
import { errorTracking } from './errorTracking';

export interface BackupData {
  id: string;
  type: 'user_data' | 'contract_state' | 'content_metadata' | 'system_config';
  data: any;
  timestamp: number;
  checksum: string;
  size: number;
  encrypted: boolean;
}

export interface BackupMetadata {
  id: string;
  type: string;
  timestamp: number;
  size: number;
  checksum: string;
  location: string;
  encrypted: boolean;
  restorable: boolean;
}

export interface RecoveryPoint {
  id: string;
  timestamp: number;
  description: string;
  backups: BackupMetadata[];
  verified: boolean;
}

class BackupRecoveryService {
  private environment = getCurrentEnvironment();
  private backupQueue: BackupData[] = [];
  private recoveryPoints: Map<string, RecoveryPoint> = new Map();
  private isBackupInProgress = false;

  constructor() {
    this.startAutomaticBackups();
    this.loadRecoveryPoints();
  }

  // Backup Operations
  public async createBackup(
    type: BackupData['type'],
    data: any,
    encrypt: boolean = true
  ): Promise<string> {
    try {
      const backupId = this.generateBackupId();
      const serializedData = JSON.stringify(data);
      const checksum = await this.calculateChecksum(serializedData);
      
      let processedData = serializedData;
      if (encrypt) {
        processedData = await this.encryptData(serializedData);
      }

      const backup: BackupData = {
        id: backupId,
        type,
        data: processedData,
        timestamp: Date.now(),
        checksum,
        size: new Blob([processedData]).size,
        encrypted: encrypt,
      };

      // Add to queue for processing
      this.backupQueue.push(backup);
      
      // Process immediately for critical data
      if (type === 'contract_state' || type === 'system_config') {
        await this.processBackupQueue();
      }

      monitoring.trackEvent({
        type: 'info',
        category: 'backup',
        message: 'Backup created',
        data: {
          backupId,
          type,
          size: backup.size,
          encrypted: encrypt,
        },
      });

      return backupId;
    } catch (error) {
      errorTracking.trackError(error as Error, {
        component: 'backup',
        action: 'create_backup',
        additionalData: { type },
      }, 'high');
      throw error;
    }
  }

  public async createUserDataBackup(userId: string, userData: any): Promise<string> {
    const backupData = {
      userId,
      userData,
      preferences: this.getUserPreferences(userId),
      walletConnections: this.getUserWalletData(userId),
      subscriptions: this.getUserSubscriptions(userId),
    };

    return this.createBackup('user_data', backupData, true);
  }

  public async createContractStateBackup(chainId: number): Promise<string> {
    const contractData = await this.getContractStates(chainId);
    return this.createBackup('contract_state', {
      chainId,
      contracts: contractData,
      blockNumber: await this.getCurrentBlockNumber(chainId),
    }, true);
  }

  public async createContentMetadataBackup(): Promise<string> {
    const contentData = await this.getContentMetadata();
    return this.createBackup('content_metadata', contentData, true);
  }

  // Recovery Operations
  public async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      const backup = await this.getBackupById(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Verify backup integrity
      const isValid = await this.verifyBackupIntegrity(backup);
      if (!isValid) {
        throw new Error(`Backup ${backupId} failed integrity check`);
      }

      // Decrypt if necessary
      let data = backup.data;
      if (backup.encrypted) {
        data = await this.decryptData(data);
      }

      const parsedData = JSON.parse(data);

      // Restore based on backup type
      switch (backup.type) {
        case 'user_data':
          await this.restoreUserData(parsedData);
          break;
        case 'contract_state':
          await this.restoreContractState(parsedData);
          break;
        case 'content_metadata':
          await this.restoreContentMetadata(parsedData);
          break;
        case 'system_config':
          await this.restoreSystemConfig(parsedData);
          break;
        default:
          throw new Error(`Unknown backup type: ${backup.type}`);
      }

      monitoring.trackEvent({
        type: 'info',
        category: 'recovery',
        message: 'Backup restored successfully',
        data: {
          backupId,
          type: backup.type,
          timestamp: backup.timestamp,
        },
      });

      return true;
    } catch (error) {
      errorTracking.trackError(error as Error, {
        component: 'backup',
        action: 'restore_backup',
        additionalData: { backupId },
      }, 'critical');
      return false;
    }
  }

  public async createRecoveryPoint(description: string): Promise<string> {
    try {
      const recoveryId = this.generateRecoveryId();
      const timestamp = Date.now();

      // Create backups for all critical data
      const backups: BackupMetadata[] = [];

      // User data backup
      const userBackupId = await this.createUserDataBackup('system', {});
      backups.push(await this.getBackupMetadata(userBackupId));

      // Contract state backups for all supported chains
      for (const chainId of [1, 137, 42161, 10, 56, 43114]) {
        try {
          const contractBackupId = await this.createContractStateBackup(chainId);
          backups.push(await this.getBackupMetadata(contractBackupId));
        } catch (error) {
          console.warn(`Failed to backup chain ${chainId}:`, error);
        }
      }

      // Content metadata backup
      const contentBackupId = await this.createContentMetadataBackup();
      backups.push(await this.getBackupMetadata(contentBackupId));

      const recoveryPoint: RecoveryPoint = {
        id: recoveryId,
        timestamp,
        description,
        backups,
        verified: false,
      };

      this.recoveryPoints.set(recoveryId, recoveryPoint);
      await this.saveRecoveryPoints();

      // Verify recovery point in background
      this.verifyRecoveryPoint(recoveryId);

      monitoring.trackEvent({
        type: 'info',
        category: 'recovery',
        message: 'Recovery point created',
        data: {
          recoveryId,
          description,
          backupCount: backups.length,
        },
      });

      return recoveryId;
    } catch (error) {
      errorTracking.trackError(error as Error, {
        component: 'backup',
        action: 'create_recovery_point',
        additionalData: { description },
      }, 'critical');
      throw error;
    }
  }

  public async restoreFromRecoveryPoint(recoveryId: string): Promise<boolean> {
    try {
      const recoveryPoint = this.recoveryPoints.get(recoveryId);
      if (!recoveryPoint) {
        throw new Error(`Recovery point ${recoveryId} not found`);
      }

      if (!recoveryPoint.verified) {
        throw new Error(`Recovery point ${recoveryId} is not verified`);
      }

      let successCount = 0;
      let totalCount = recoveryPoint.backups.length;

      for (const backupMetadata of recoveryPoint.backups) {
        try {
          const success = await this.restoreFromBackup(backupMetadata.id);
          if (success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to restore backup ${backupMetadata.id}:`, error);
        }
      }

      const success = successCount === totalCount;

      monitoring.trackEvent({
        type: success ? 'info' : 'warning',
        category: 'recovery',
        message: 'Recovery point restoration completed',
        data: {
          recoveryId,
          successCount,
          totalCount,
          success,
        },
      });

      return success;
    } catch (error) {
      errorTracking.trackError(error as Error, {
        component: 'backup',
        action: 'restore_recovery_point',
        additionalData: { recoveryId },
      }, 'critical');
      return false;
    }
  }

  // Utility Methods
  public getRecoveryPoints(): RecoveryPoint[] {
    return Array.from(this.recoveryPoints.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public async getBackupHistory(type?: BackupData['type']): Promise<BackupMetadata[]> {
    // In a real implementation, this would query the backup storage
    const mockHistory: BackupMetadata[] = [
      {
        id: 'backup_1',
        type: 'user_data',
        timestamp: Date.now() - 3600000,
        size: 1024 * 1024,
        checksum: 'abc123',
        location: 'storage://backups/backup_1',
        encrypted: true,
        restorable: true,
      },
      {
        id: 'backup_2',
        type: 'contract_state',
        timestamp: Date.now() - 7200000,
        size: 2048 * 1024,
        checksum: 'def456',
        location: 'storage://backups/backup_2',
        encrypted: true,
        restorable: true,
      },
    ];

    return type 
      ? mockHistory.filter(backup => backup.type === type)
      : mockHistory;
  }

  public async verifyBackupIntegrity(backup: BackupData): Promise<boolean> {
    try {
      const currentChecksum = await this.calculateChecksum(backup.data);
      return currentChecksum === backup.checksum;
    } catch (error) {
      return false;
    }
  }

  public async deleteOldBackups(olderThanDays: number = 30): Promise<number> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    // In a real implementation, this would delete from actual storage
    // For now, we'll just track the operation
    
    monitoring.trackEvent({
      type: 'info',
      category: 'backup',
      message: 'Old backups cleanup completed',
      data: {
        deletedCount,
        cutoffTime,
        olderThanDays,
      },
    });

    return deletedCount;
  }

  // Private Methods
  private startAutomaticBackups() {
    // Create recovery points every 6 hours
    setInterval(async () => {
      try {
        await this.createRecoveryPoint(`Automatic backup - ${new Date().toISOString()}`);
      } catch (error) {
        console.error('Automatic backup failed:', error);
      }
    }, 6 * 60 * 60 * 1000);

    // Process backup queue every 5 minutes
    setInterval(async () => {
      await this.processBackupQueue();
    }, 5 * 60 * 1000);

    // Clean up old backups daily
    setInterval(async () => {
      await this.deleteOldBackups(30);
    }, 24 * 60 * 60 * 1000);
  }

  private async processBackupQueue() {
    if (this.isBackupInProgress || this.backupQueue.length === 0) {
      return;
    }

    this.isBackupInProgress = true;

    try {
      while (this.backupQueue.length > 0) {
        const backup = this.backupQueue.shift()!;
        await this.storeBackup(backup);
      }
    } catch (error) {
      errorTracking.trackError(error as Error, {
        component: 'backup',
        action: 'process_queue',
      }, 'high');
    } finally {
      this.isBackupInProgress = false;
    }
  }

  private async storeBackup(backup: BackupData): Promise<void> {
    // In a real implementation, this would store to cloud storage, IPFS, etc.
    // For now, we'll store in localStorage for demo purposes
    try {
      const storageKey = `backup_${backup.id}`;
      localStorage.setItem(storageKey, JSON.stringify(backup));
      
      monitoring.trackEvent({
        type: 'info',
        category: 'backup',
        message: 'Backup stored successfully',
        data: {
          backupId: backup.id,
          type: backup.type,
          size: backup.size,
        },
      });
    } catch (error) {
      throw new Error(`Failed to store backup ${backup.id}: ${error}`);
    }
  }

  private async getBackupById(backupId: string): Promise<BackupData | null> {
    try {
      const storageKey = `backup_${backupId}`;
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata> {
    const backup = await this.getBackupById(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    return {
      id: backup.id,
      type: backup.type,
      timestamp: backup.timestamp,
      size: backup.size,
      checksum: backup.checksum,
      location: `storage://backups/${backup.id}`,
      encrypted: backup.encrypted,
      restorable: true,
    };
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecoveryId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async encryptData(data: string): Promise<string> {
    // Simple encryption for demo - in production, use proper encryption
    return btoa(data);
  }

  private async decryptData(encryptedData: string): Promise<string> {
    // Simple decryption for demo - in production, use proper decryption
    return atob(encryptedData);
  }

  private async verifyRecoveryPoint(recoveryId: string) {
    setTimeout(async () => {
      const recoveryPoint = this.recoveryPoints.get(recoveryId);
      if (!recoveryPoint) return;

      let allVerified = true;
      for (const backupMetadata of recoveryPoint.backups) {
        const backup = await this.getBackupById(backupMetadata.id);
        if (!backup || !(await this.verifyBackupIntegrity(backup))) {
          allVerified = false;
          break;
        }
      }

      recoveryPoint.verified = allVerified;
      await this.saveRecoveryPoints();
    }, 5000); // Verify after 5 seconds
  }

  private async loadRecoveryPoints() {
    try {
      const stored = localStorage.getItem('recovery_points');
      if (stored) {
        const points = JSON.parse(stored);
        for (const point of points) {
          this.recoveryPoints.set(point.id, point);
        }
      }
    } catch (error) {
      console.error('Failed to load recovery points:', error);
    }
  }

  private async saveRecoveryPoints() {
    try {
      const points = Array.from(this.recoveryPoints.values());
      localStorage.setItem('recovery_points', JSON.stringify(points));
    } catch (error) {
      console.error('Failed to save recovery points:', error);
    }
  }

  // Mock data methods (replace with real implementations)
  private getUserPreferences(userId: string): any {
    return { theme: 'dark', language: 'en' };
  }

  private getUserWalletData(userId: string): any {
    return { connectedWallets: [], lastUsedWallet: null };
  }

  private getUserSubscriptions(userId: string): any {
    return { activeSubscriptions: [], subscriptionHistory: [] };
  }

  private async getContractStates(chainId: number): Promise<any> {
    return { chainId, contracts: {}, timestamp: Date.now() };
  }

  private async getCurrentBlockNumber(chainId: number): Promise<number> {
    return 12345678; // Mock block number
  }

  private async getContentMetadata(): Promise<any> {
    return { contents: [], totalCount: 0, lastUpdated: Date.now() };
  }

  private async restoreUserData(data: any): Promise<void> {
    console.log('Restoring user data:', data);
  }

  private async restoreContractState(data: any): Promise<void> {
    console.log('Restoring contract state:', data);
  }

  private async restoreContentMetadata(data: any): Promise<void> {
    console.log('Restoring content metadata:', data);
  }

  private async restoreSystemConfig(data: any): Promise<void> {
    console.log('Restoring system config:', data);
  }
}

// Global backup and recovery instance
export const backupRecovery = new BackupRecoveryService();