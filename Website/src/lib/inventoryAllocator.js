/**
 * Inventory Allocator Module
 * Allocates stock from batches based on specified strategies: FEFO, LIFO, FIFO.
 */

/**
 * Allocates inventory for a list of order items from available stock batches.
 * 
 * @param {Array} orderItems - List of items to allocate. Each item: { sku, qty, strategy? }
 * @param {Array} availableStock - List of available stock batches. Each batch: 
 *                                 { batchId, sku, quantity, expiryDate, createdAt }
 * @param {String} defaultStrategy - Global strategy if not specified per item ('FIFO', 'FEFO', 'LIFO').
 * @returns {Object} - Allocation result: 
 *                     { 
 *                       allocations: [{ sku, requestedQty, allocatedQty, batches: [{ batchId, qty }] }],
 *                       missing: [{ sku, missingQty }] 
 *                     }
 */
export function allocateInventory(orderItems, availableStock, defaultStrategy = 'FIFO') {
    const stockBySku = {};

    // Group stock by SKU
    availableStock.forEach(batch => {
        if (!stockBySku[batch.sku]) {
            stockBySku[batch.sku] = [];
        }
        stockBySku[batch.sku].push({ ...batch }); // Clone to track remaining qty locally
    });

    const result = {
        allocations: [],
        missing: []
    };

    for (const item of orderItems) {
        const sku = item.sku;
        const requestedQty = item.qty;
        const strategy = item.strategy || defaultStrategy;

        const itemAllocation = {
            sku,
            requestedQty,
            allocatedQty: 0,
            batches: []
        };

        const candidates = stockBySku[sku] || [];

        if (candidates.length === 0) {
            result.missing.push({ sku, missingQty: requestedQty });
            result.allocations.push(itemAllocation);
            continue;
        }

        // Sort candidates based on strategy
        sortBatches(candidates, strategy);

        let remainingToAllocate = requestedQty;

        for (const batch of candidates) {
            if (remainingToAllocate <= 0) break;
            if (batch.quantity <= 0) continue;

            const takeQty = Math.min(remainingToAllocate, batch.quantity);

            itemAllocation.batches.push({
                batchId: batch.batchId,
                qty: takeQty,
                strategyUsed: strategy,
                batchDate: strategy === 'FEFO' ? batch.expiryDate : batch.createdAt
            });

            itemAllocation.allocatedQty += takeQty;
            remainingToAllocate -= takeQty;
            batch.quantity -= takeQty; // Update local available stock
        }

        if (remainingToAllocate > 0) {
            result.missing.push({ sku, missingQty: remainingToAllocate });
        }

        result.allocations.push(itemAllocation);
    }

    return result;
}

/**
 * Sorts batches in-place based on strategy.
 */
function sortBatches(batches, strategy) {
    if (strategy === 'FEFO') {
        // First Expired First Out: Sort by expiryDate ASC
        batches.sort((a, b) => {
            // Null expiry dates should be treated as "last" or "non-perishable"? 
            // Usually FEFO applies to perishables. Non-perishables (null expiry) go last.
            if (!a.expiryDate && !b.expiryDate) return 0;
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return new Date(a.expiryDate) - new Date(b.expiryDate);
        });
    } else if (strategy === 'LIFO') {
        // Last In First Out: Sort by createdAt DESC
        batches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
        // FIFO (Default): Sort by createdAt ASC
        batches.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
}
