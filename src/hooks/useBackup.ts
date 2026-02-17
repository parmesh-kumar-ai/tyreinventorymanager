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
            if (!token) {
                console.log('Skipping backup: No Google Access Token');
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
                console.log('Data changed, starting backup...');
                const success = await uploadToDrive(token, {
                    inventory,
                    stores,
                    transactions,
                    managedBrands,
                    timestamp: new Date().toISOString()
                });

                if (success) {
                    lastBackupData.current = currentData;
                    console.log('Backup cycle completed.');
                }
            } else {
                console.log('Skipping backup: No changes detected');
            }

        }, 60 * 1000); // 1 Minute

        return () => clearInterval(interval);
    }, [inventory, stores, transactions, managedBrands]);
};
