'use server';

import { auth } from "@/auth";
import { db } from "@/src/index";
import { orders, orderItems, products } from "@/src/db/schema";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createTestOrder() {
  const session = await auth();
  if (!session?.user?.id) return;

  const userId = parseInt(session.user.id);

  // 1. Pick a random product
  const randomProduct = await db.query.products.findFirst();
  if (!randomProduct) return;

  // 2. Create a Fake Order
  const [newOrder] = await db.insert(orders).values({
    userId,
    totalAmount: randomProduct.price, // Simple total for test
    status: 'processing',
  }).returning();

  // 3. Add item to order
  await db.insert(orderItems).values({
    orderId: newOrder.id,
    productId: randomProduct.id,
    quantity: 1,
    priceAtPurchase: randomProduct.price,
  });

  revalidatePath("/profile");
}