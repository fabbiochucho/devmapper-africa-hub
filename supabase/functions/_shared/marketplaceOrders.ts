// deno-lint-ignore-file no-explicit-any

export interface ConfirmOrderPaidResult {
  success: boolean;
  reason?: "order_not_found_or_already_processed" | "update_failed" | "portfolio_failed";
}

/**
 * Marks a carbon_credit_order as paid (which lets the existing
 * update_listing_credits_on_order trigger fire and decrement listing
 * inventory), then creates/attaches a portfolio_holdings row so the buyer's
 * Carbon Portfolio page has something to show. Shared by the Flutterwave
 * and Paystack webhook handlers.
 */
export async function confirmOrderPaid(
  supabase: any,
  orderId: string,
  paymentReference: string,
): Promise<ConfirmOrderPaidResult> {
  // Guard on status='pending' so a duplicate webhook delivery (on top of the
  // idempotency check already done at the webhook level) can't double-fire
  // the inventory-decrement trigger or create a second portfolio holding.
  const { data: order, error: updateError } = await supabase
    .from("carbon_credit_orders")
    .update({ status: "paid", payment_reference: paymentReference })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id, buyer_id, listing_id, quantity, price_per_tonne, total_amount")
    .maybeSingle();

  if (updateError) {
    console.error("[marketplaceOrders] Failed to mark order paid:", updateError);
    return { success: false, reason: "update_failed" };
  }

  if (!order) {
    console.warn("[marketplaceOrders] Order not found or already processed:", orderId);
    return { success: false, reason: "order_not_found_or_already_processed" };
  }

  // Find-or-create a default portfolio for the buyer. Naming/target/budget
  // defaults here are placeholders - there's no product-defined default yet.
  const { data: existingPortfolio } = await supabase
    .from("carbon_portfolios")
    .select("id")
    .eq("user_id", order.buyer_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let portfolioId = existingPortfolio?.id as string | undefined;

  if (!portfolioId) {
    const { data: newPortfolio, error: portfolioError } = await supabase
      .from("carbon_portfolios")
      .insert([{ user_id: order.buyer_id, name: "My Portfolio" }])
      .select("id")
      .single();

    if (portfolioError || !newPortfolio) {
      console.error("[marketplaceOrders] Failed to create default portfolio:", portfolioError);
      return { success: false, reason: "portfolio_failed" };
    }
    portfolioId = newPortfolio.id;
  }

  const { error: holdingError } = await supabase.from("portfolio_holdings").insert([{
    portfolio_id: portfolioId,
    listing_id: order.listing_id,
    order_id: order.id,
    quantity: order.quantity,
    purchase_price: order.price_per_tonne,
    current_value: order.total_amount,
    status: "held",
  }]);

  if (holdingError) {
    console.error("[marketplaceOrders] Failed to create portfolio holding:", holdingError);
    return { success: false, reason: "portfolio_failed" };
  }

  console.log(`[marketplaceOrders] Order ${orderId} confirmed paid, portfolio holding created`);
  return { success: true };
}
