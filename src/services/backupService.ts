export const GOOGLE_DRIVE_FILE_NAME = 'tyre-inventory-backup.json';

interface BackupData {
    inventory: any[];
    stores: any[];
    transactions: any[];
    managedBrands: string[];
    timestamp: string;
}

export const uploadToDrive = async (accessToken: string, data: BackupData): Promise<{ success: boolean; error?: string }> => {
    try {
        // 1. Search for existing file
        const query = `name='${GOOGLE_DRIVE_FILE_NAME}' and trashed=false`;
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!searchResponse.ok) {
            const errText = await searchResponse.text();
            console.error('Drive Search Error Body:', errText);
            if (searchResponse.status === 401) return { success: false, error: 'Token expired. Please Unlink and Link again.' };
            return { success: false, error: `Search query failed (${searchResponse.status}): ${errText}` };
        }

        const searchResult = await searchResponse.json();

        const fileContent = JSON.stringify(data, null, 2);

        // ... rest of the function (update/create logic is fine, but let's just replace the search block to be safe)
        // Actually, to be safe and clean, I will just return the search part if I can, but the tool requires contiguous replacement.
        // The instruction says "Modify uploadToDrive". I will replace the BEGINNING of the function up to the searchResult usage.

        // Wait, I need to be careful with the instruction. I'll replace the block from the start of the function to where searchResult is defined.

        // ... (Re-reading the tool definition: "StartLine and EndLine should specify a range of lines containing precisely the instances of TargetContent")
        // I will target the specific error handling block.



        // 2. If file exists, update it. Else, create new.
        if (searchResult.files && searchResult.files.length > 0) {
            const fileId = searchResult.files[0].id;
            console.log('Existing backup found. Updating:', fileId);

            // For update, we use upload API with PATCH
            const updateResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: fileContent
            });

            if (!updateResponse.ok) {
                const errText = await updateResponse.text();
                try {
                    const errJson = JSON.parse(errText);
                    return { success: false, error: `Update failed: ${errJson.error?.message || updateResponse.statusText}` };
                } catch {
                    return { success: false, error: `Update failed: ${updateResponse.statusText}` };
                }
            }
            console.log('Backup updated successfully:', fileId);

        } else {
            console.log('Creating new backup file...');
            // Step 1: Create file with metadata (but no content yet)
            const metadata = {
                name: GOOGLE_DRIVE_FILE_NAME,
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
                const errText = await createResponse.text();
                return { success: false, error: `Metadata creation failed: ${createResponse.statusText}` };
            }

            const fileData = await createResponse.json();
            const newFileId = fileData.id;
            console.log('File metadata created with ID:', newFileId);

            // Step 2: Upload content to the new file
            const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: fileContent
            });

            if (!uploadResponse.ok) {
                const errText = await uploadResponse.text();
                return { success: false, error: `Content upload failed: ${uploadResponse.statusText}` };
            }
            console.log('New backup content uploaded successfully');
        }
        return { success: true };
    } catch (error: any) {
        console.error('Backup failed:', error);
        return { success: false, error: error.message || 'Unknown network error' };
    }
};

export const restoreFromDrive = async (accessToken: string): Promise<BackupData | null> => {
    try {
        const query = `name='${GOOGLE_DRIVE_FILE_NAME}' and trashed=false`;
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        const searchResult = await searchResponse.json();

        if (searchResult.files && searchResult.files.length > 0) {
            const fileId = searchResult.files[0].id;
            const downloadResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
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
        }
        console.warn('No backup file found with name:', GOOGLE_DRIVE_FILE_NAME);
        return null; // No backup found
    } catch (error) {
        console.error('Restore failed:', error);
        return null;
    }
};
