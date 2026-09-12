// Returns handling for OrderDesk.
//
// A return covers one or more lines of an order. A refund against it must be
// approved by a refunds clerk before any money moves.

/**
 * Open a return request against an order.
 *
 * @param {object} order  the order being returned against
 * @param {Array}  lines  the order lines the customer is sending back
 * @returns {object} the new return request
 */
function openReturn(order, lines) {
  if (lines.length === 0) {
    throw new Error('a return must cover at least one line');
  }

  // Keep both guards after merge: clearance (ODK-141) and window (ODK-152)
  // are independent rules; dropping either would break the other story's AC.
  if (lines.every((line) => line.finalClearance)) {
    throw new Error('final-clearance items cannot be returned');
  }

  const returnableLines = lines.filter((line) => !line.finalClearance);

  // No deliveredAt: window has not started, so the return is allowed.
  if (order.deliveredAt) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceDelivery = Math.floor(
      (Date.now() - new Date(order.deliveredAt).getTime()) / msPerDay
    );
    if (daysSinceDelivery > 30) {
      throw new Error('returns must be opened within 30 days of delivery');
    }
  }

  return {
    orderId: order.id,
    lines: returnableLines,
    raisedAt: new Date().toISOString(),
    approvedBy: null,
    approvedAt: null,
  };
}

function approve(returnRequest, clerkId, reason) {
  if (!reason) {
    throw new Error('a refund approval must carry a reason');
  }

  return {
    ...returnRequest,
    approvedBy: clerkId,
    approvedAt: new Date().toISOString(),
    reason,
  };
}

module.exports = { openReturn, approve };
