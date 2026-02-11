/**
 * Inventory Allocator Module
 * Allocates stock from batches based on specified strategies: FEFO, LIFO, FIFO.
 */

/**
 * Allocate requested quantities of order items from available stock batches using FIFO, FEFO, or LIFO strategies.
 *
 * @param {Array<{sku: string, qty: number, strategy?: string}>} orderItems - Items to allocate; each entry must include `sku` and `qty`; `strategy` overrides the default for that item.
 * @param {Array<{batchId: string, sku: string, quantity: number, expiryDate?: string|null, createdAt: string}>} availableStock - Inventory batches available for allocation.
 * @param {string} [defaultStrategy='FIFO'] - Strategy to use when an item does not specify one: `'FIFO'`, `'FEFO'`, or `'LIFO'`.
 * @returns {{allocations: Array<{sku: string, requestedQty: number, allocatedQty: number, batches: Array<{batchId: string, qty: number, strategyUsed: string, batchDate: string|null}>}>, missing: Array<{sku: string, missingQty: number}>}} An object containing `allocations` (per-item allocation details and the batches used) and `missing` (items with any unfulfilled quantity).
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
 * Order an array of stock batches in-place according to the chosen allocation strategy.
 *
 * FEFO orders by `expiryDate` ascending (earliest expiry first), placing batches with a null `expiryDate` after expiring batches.
 * LIFO orders by `createdAt` descending (newest first).
 * FIFO (default) orders by `createdAt` ascending (oldest first).
 *
 * @param {Array<Object>} batches - Array of batch objects to sort in-place; expected to have `expiryDate` and `createdAt` properties.
 * @param {string} [strategy] - Allocation strategy: `'FEFO'`, `'LIFO'`, or `'FIFO'` (default).
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