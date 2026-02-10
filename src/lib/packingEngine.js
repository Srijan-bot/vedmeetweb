/**
 * Warehouse Cartonization and Packing Optimization Engine
 * Matches items to optimal cartons based on dimensions, weight, and constraints.
 */

/**
 * Optimizes packing for a given order.
 * @param {Object} input - The input JSON object containing items, cartons, and constraints.
 * @returns {Object} - The optimized packing result.
 */
function optimizePacking(input) {
    const { orderId, volumetricDivisor = 5000, packingClearanceCm = 0, items, cartons } = input;

    // 1. Expand items by quantity
    const expandedItems = [];
    items.forEach(item => {
        for (let i = 0; i < item.qty; i++) {
            expandedItems.push({
                ...item,
                id: `${item.sku}_${i}`, // Unique ID for tracking
                originalQty: item.qty
            });
        }
    });

    // Sort items by volume (largest first) - heuristic for better packing
    expandedItems.sort((a, b) => {
        const volA = a.dimensionsCm.L * a.dimensionsCm.W * a.dimensionsCm.H;
        const volB = b.dimensionsCm.L * b.dimensionsCm.W * b.dimensionsCm.H;
        return volB - volA;
    });

    // 2. Filter valid cartons
    const result = {
        orderId,
        recommendedCartons: [],
        optimizationReason: [],
        constraintViolations: []
    };

    let remainingItems = [...expandedItems];

    while (remainingItems.length > 0) {
        let bestCartonSolution = null;
        let itemsPackedInBest = [];

        // Try each carton definition to find the best fit for current remaining items
        for (const carton of cartons) {
            const packingResult = packItemsIntoCarton(remainingItems, carton, packingClearanceCm);

            if (packingResult.packedItems.length > 0) {
                // Calculate metrics for this solution
                const deadWeight = packingResult.packedItems.reduce((sum, item) => sum + item.weightKg, 0) + carton.emptyWeightKg;
                const volWeight = (carton.innerDimensionsCm.L * carton.innerDimensionsCm.W * carton.innerDimensionsCm.H) / volumetricDivisor;
                const billableWeight = Math.max(deadWeight, volWeight);

                // Scoring: We want to maximize items packed, then minimize billable weight.
                const isBetter = isBetterSolution(bestCartonSolution, {
                    carton,
                    packedItems: packingResult.packedItems,
                    layers: packingResult.layers,
                    billableWeight,
                    deadWeight,
                    volumetricWeight: volWeight
                }, remainingItems.length);

                if (isBetter) {
                    bestCartonSolution = {
                        carton,
                        packedItems: packingResult.packedItems,
                        layers: packingResult.layers,
                        billableWeight,
                        deadWeight,
                        volumetricWeight: volWeight
                    };
                    itemsPackedInBest = packingResult.packedItems;
                }
            }
        }

        if (!bestCartonSolution) {
            // Could not pack remaining items into ANY carton. 
            const violationMsg = `Could not pack ${remainingItems.length} items. They might be too large or heavy for available cartons.`;
            result.constraintViolations.push(violationMsg);
            result.optimizationReason.push("Partial failure: Some items could not be packed.");
            break;
        }

        // Commit this carton
        result.recommendedCartons.push({
            cartonId: bestCartonSolution.carton.cartonId,
            finalDimensionsCm: {
                L: bestCartonSolution.carton.innerDimensionsCm.L + packingClearanceCm,
                W: bestCartonSolution.carton.innerDimensionsCm.W + packingClearanceCm,
                H: bestCartonSolution.carton.innerDimensionsCm.H + packingClearanceCm
            },
            deadWeightKg: Number(bestCartonSolution.deadWeight.toFixed(2)),
            volumetricWeightKg: Number(bestCartonSolution.volumetricWeight.toFixed(2)),
            billableWeightKg: Number(bestCartonSolution.billableWeight.toFixed(2)),
            itemsPacked: bestCartonSolution.packedItems.map(i => i.sku),
            layoutStrategy: "Layered Best Fit",
            layers: bestCartonSolution.layers
        });

        // Remove packed items from remaining
        const packedIds = new Set(itemsPackedInBest.map(i => i.id));
        remainingItems = remainingItems.filter(item => !packedIds.has(item.id));
    }

    if (result.recommendedCartons.length > 0 && result.constraintViolations.length === 0) {
        result.optimizationReason.push(`Successfully packed into ${result.recommendedCartons.length} cartons minimized for billable weight.`);
    }

    return result;
}

function isBetterSolution(currentBest, candidate, totalRemainingCount) {
    if (!currentBest) return true;

    const candidateCount = candidate.packedItems.length;
    const currentCount = currentBest.packedItems.length;

    // 1. Maximize number of items packed (greedy approach)
    if (candidateCount > currentCount) return true;
    if (candidateCount < currentCount) return false;

    // 2. If same item count, minimize billable weight
    if (candidate.billableWeight < currentBest.billableWeight) return true;

    return false;
}

/**
 * Tries to pack as many items as possible into a specific carton.
 */
function packItemsIntoCarton(items, carton, clearance) {
    const L = carton.innerDimensionsCm.L;
    const W = carton.innerDimensionsCm.W;
    const H = carton.innerDimensionsCm.H;
    const maxWeight = carton.maxWeightKg;

    let currentWeight = carton.emptyWeightKg;
    const packedItems = [];
    const layers = []; // { heightCm: number, items: [] }

    // Prioritize packing non-fragile first (bottom), then fragile.
    // Liquid must be upright (handled in orientation).

    let candidates = [...items].sort((a, b) => {
        if (a.fragile !== b.fragile) return a.fragile ? 1 : -1; // Non-fragile first (bottom)
        // Then by volume
        const volA = a.dimensionsCm.L * a.dimensionsCm.W * a.dimensionsCm.H;
        const volB = b.dimensionsCm.L * b.dimensionsCm.W * b.dimensionsCm.H;
        return volB - volA;
    });

    let currentHeight = 0;

    while (candidates.length > 0 && currentHeight < H) {
        const remainingH = H - currentHeight;

        // Try to form a layer
        const layerResult = formLayer(candidates, L, W, remainingH, maxWeight - currentWeight);

        if (layerResult.items.length === 0) {
            // Cannot fit anything more
            break;
        }

        // Add layer
        layers.push({
            heightCm: layerResult.height,
            items: layerResult.items.map(i => i.sku)
        });

        packedItems.push(...layerResult.items);
        currentWeight += layerResult.weight;
        currentHeight += layerResult.height;

        // Remove packed from candidates
        const packedIds = new Set(layerResult.items.map(i => i.id));
        candidates = candidates.filter(i => !packedIds.has(i.id));
    }

    return { packedItems, layers };
}

/**
 * Forms a single layer of items ensuring they fit in L x W.
 * Returns items in layer, layer height, layer weight.
 */
function formLayer(candidates, maxL, maxW, maxH, maxWeightAllowed) {
    const layerItems = [];
    let layerWeight = 0;

    // Placements within the layer
    const placements = []; // {x, y, l, w, h}

    let layerHeight = 0;

    for (const item of candidates) {
        if (item.weightKg + layerWeight > maxWeightAllowed) continue;

        // Get allowed orientations that fit maxH
        const orientations = getAllowedOrientations(item, maxH);

        // Try to place this item in the layer
        for (const orient of orientations) {
            const position = findPosition(placements, orient.l, orient.w, maxL, maxW);

            if (position) {
                placements.push({
                    x: position.x,
                    y: position.y,
                    l: orient.l,
                    w: orient.w,
                    h: orient.h,
                    id: item.id
                });

                layerItems.push(item);
                layerWeight += item.weightKg;
                layerHeight = Math.max(layerHeight, orient.h);
                break; // Item placed, move to next item
            }
        }
    }

    return {
        items: layerItems,
        height: layerHeight,
        weight: layerWeight
    };
}

function getAllowedOrientations(item, maxH) {
    // item.dimensionsCm {L, W, H}
    const dims = [item.dimensionsCm.L, item.dimensionsCm.W, item.dimensionsCm.H];

    const possible = [];

    if (item.rotatable === false) {
        // Only one orientation: Original
        if (item.dimensionsCm.H <= maxH) {
            possible.push({ l: item.dimensionsCm.L, w: item.dimensionsCm.W, h: item.dimensionsCm.H });
        }
        return possible;
    }

    if (item.uprightOnly) {
        // Can rotate on Z axis (swap L/W) but H must be H.
        if (item.dimensionsCm.H <= maxH) {
            possible.push({ l: item.dimensionsCm.L, w: item.dimensionsCm.W, h: item.dimensionsCm.H });
            possible.push({ l: item.dimensionsCm.W, w: item.dimensionsCm.L, h: item.dimensionsCm.H });
        }
        return possible;
    }

    // Fully rotatable: 3 choices for Height constraint, then 2 choices for L/W per Height.
    const perms = [
        [dims[0], dims[1], dims[2]], // H is dims[2]
        [dims[0], dims[2], dims[1]], // H is dims[1]
        [dims[1], dims[2], dims[0]], // H is dims[0]
    ];

    const checked = new Set();

    for (const p of perms) {
        const h = p[2];
        const l = p[0];
        const w = p[1];

        if (h <= maxH) {
            const key1 = `${l}x${w}x${h}`;
            if (!checked.has(key1)) {
                possible.push({ l, w, h });
                checked.add(key1);
            }

            const key2 = `${w}x${l}x${h}`;
            if (!checked.has(key2)) {
                possible.push({ l: w, w: l, h });
                checked.add(key2);
            }
        }
    }

    // Sort orientations? Keep largest footprint first to fill layer?
    possible.sort((a, b) => (b.l * b.w) - (a.l * a.w));

    return possible;
}

/**
 * Finds a coordinate (x,y) to place a rectangle l*w within maxL*maxW avoiding overlaps.
 */
function findPosition(existingRects, l, w, maxL, maxW) {
    if (existingRects.length === 0) {
        if (l <= maxL && w <= maxW) return { x: 0, y: 0 };
        return null;
    }

    // Try to place at (0,0) and every corner of existing rects
    let points = [{ x: 0, y: 0 }];
    for (const r of existingRects) {
        points.push({ x: r.x + r.l, y: r.y });
        points.push({ x: r.x, y: r.y + r.w });
    }

    // Sort points Y then X (top-left priority)
    points.sort((a, b) => a.y - b.y || a.x - b.x);

    for (const p of points) {
        // Check bounds
        if (p.x + l > maxL || p.y + w > maxW) continue;

        // Check collision
        let collision = false;
        for (const r of existingRects) {
            if (rectIntersect(p.x, p.y, l, w, r.x, r.y, r.l, r.w)) {
                collision = true;
                break;
            }
        }

        if (!collision) return p;
    }

    return null;
}

function rectIntersect(x1, y1, l1, w1, x2, y2, l2, w2) {
    return x1 < x2 + l2 &&
        x1 + l1 > x2 &&
        y1 < y2 + w2 &&
        y1 + w1 > y2;
}

export { optimizePacking };
