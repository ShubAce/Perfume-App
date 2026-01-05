'use server';

import { db } from '@/src/index'; 
import { carts, cartItems } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto'; // Native Node.js module, no install needed

export async function addToCart(productId: number, quantity: number = 1) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('cart_session')?.value;
  let cartId: number;

  try {
    // 1. Check if a cart already exists for this Guest
    if (sessionToken) {
      const existingCart = await db.query.carts.findFirst({
        where: eq(carts.sessionToken, sessionToken),
      });
      
      if (existingCart) {
        cartId = existingCart.id;
      } else {
        // Token existed but cart didn't (rare edge case), create new
        cartId = await createNewCart(cookieStore);
      }
    } else {
      // 2. No session? Create a completely new Cart
      cartId = await createNewCart(cookieStore);
    }

    // 3. Add Item to Cart
    // Check if this product is already in the cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId)
      ),
    });

    if (existingItem) {
      // Update quantity if it exists
      await db.update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      // Create new line item if it doesn't
      await db.insert(cartItems).values({
        cartId,
        productId,
        quantity,
      });
    }

    revalidatePath('/'); // Refresh the page to show new cart state
    return { success: true, message: 'Added to cart' };

  } catch (error) {
    console.error('Add to cart failed:', error);
    return { success: false, message: 'Something went wrong' };
  }
}

// Helper to create cart and set cookie
async function createNewCart(cookieStore: any) {
  const newToken = randomUUID();
  
  const [newCart] = await db.insert(carts)
    .values({ sessionToken: newToken })
    .returning();

  cookieStore.set('cart_session', newToken, { 
    path: '/', 
    httpOnly: true, 
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });

  return newCart.id;
}

export async function removeFromCart(itemId: number) {
  try {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
    revalidatePath('/cart'); // Refresh the UI instantly
    return { success: true, message: 'Removed' };
  } catch (error) {
    return { success: false, message: 'Failed to remove' };
  }
}