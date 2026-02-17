// Prefix for backup files to identify them
const BACKUP_FILE_PREFIX = 'tyre-inventory-backup-';

interface BackupData {
    inventory: any[];
    stores: any[];
    transactions: any[];
    managedBrands: string[];
    warranties?: any[];
    claims?: any[];
    timestamp: string;
}

interface DriveFile {
    id: string;
    name: string;
    createdTime?: string;
}

export const listBackups = async (accessToken: string): Promise<DriveFile[]> => {
    try {
        const query = `name contains '${BACKUP_FILE_PREFIX}' and trashed=false`;
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id, name, createdTime)`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) return [];
        const data = await response.json();
        return data.files || [];
    } catch (error) {
        console.error('Failed to list backups:', error);
        return [];
    }
};

export const deleteFile = async (accessToken: string, fileId: string): Promise<boolean> => {
    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to delete file:', error);
        return false;
    }
};

export const uploadToDrive = async (accessToken: string, data: BackupData): Promise<{ success: boolean; error?: string }> => {
    try {
        const fileName = `${BACKUP_FILE_PREFIX}${new Date(data.timestamp).toISOString().replace(/[:.]/g, '-')}.json`;
        const fileContent = JSON.stringify(data, null, 2);

        // 1. Create new backup file
        const metadata = {
            name: fileName,
            mimeType: 'application/json',
        };

        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata)
        });

        if (!createResponse.ok) {
            return { success: false, error: `Metadata creation failed: ${createResponse.statusText}` };
        }

        const fileData = await createResponse.json();
        const newFileId = fileData.id;

        // 2. Upload content
        const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: fileContent
        });

        if (!uploadResponse.ok) {
            return { success: false, error: `Content upload failed: ${uploadResponse.statusText}` };
        }

        // 3. Rotate Backups (Keep last 10)
        const backups = await listBackups(accessToken);
        if (backups.length > 10) {
            const filesToDelete = backups.slice(10); // Since sorted by createdTime desc, these are oldest
            for (const file of filesToDelete) {
                await deleteFile(accessToken, file.id);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Backup failed:', error);
        return { success: false, error: error.message || 'Unknown network error' };
    }
};

export const restoreFromDrive = async (accessToken: string, fileId?: string): Promise<BackupData | null> => {
    try {
        let targetFileId = fileId;

        // If no fileId provided, get the latest one
        if (!targetFileId) {
            const backups = await listBackups(accessToken);
            if (backups.length > 0) {
                targetFileId = backups[0].id;
            }
        }

        if (!targetFileId) {
            console.warn('No backup file found.');
            return null;
        }

        const downloadResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${targetFileId}?alt=media`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!downloadResponse.ok) {
            console.error('Failed to download file:', downloadResponse.statusText);
            return null;
        }

        const data = await downloadResponse.json();
        return data as BackupData;
    } catch (error) {
        console.error('Restore failed:', error);
        return null;
    }
};
