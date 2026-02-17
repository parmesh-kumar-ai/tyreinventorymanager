import { useEffect, useRef } from 'react';
import { uploadToDrive } from '../services/backupService';
import type { useInventory } from './useInventory';

export const useBackup = (
    inventoryData: ReturnType<typeof useInventory>
) => {
    const { inventory, stores, transactions, managedBrands } = inventoryData;
    const lastBackupData = useRef<string>('');

    useEffect(() => {
        const interval = setInterval(async () => {
            const token = sessionStorage.getItem('google_access_token');
            const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';

            if (!token || !autoBackupEnabled) {
                // console.log('Skipping backup: No Token or Auto-Backup Disabled');
                return;
            }

            const currentData = JSON.stringify({
                inventory,
                stores,
                transactions,
                managedBrands
            });

            // Only backup if data changed
            if (currentData !== lastBackupData.current) {
                console.log('Data changed, starting auto-backup...');
                const success = await uploadToDrive(token, {
                    inventory,
                    stores,
                    transactions,
                    managedBrands,
                    timestamp: new Date().toISOString()
                });

                if (success) {
                    lastBackupData.current = currentData;
                    console.log('Auto-backup cycle completed.');
                }
            }
        }, 30 * 60 * 1000); // 30 Minutes

        return () => clearInterval(interval);
    }, [inventory, stores, transactions, managedBrands]);
};
