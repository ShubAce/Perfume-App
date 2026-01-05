'use client';

import { useTransition } from 'react';
import { addToCart } from '../actions/actions'; // Import the action we made in Step 2

interface AddToCartProps {
  productId: number;
}

export default function AddToCartButton({ productId }: AddToCartProps) {
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = () => {
    startTransition(async () => {
      const result = await addToCart(productId, 1);
      
      if (result.success) {
        // You could add a toast notification library here later (like sonner or react-hot-toast)
        console.log("Success:", result.message);
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isPending}
      className={`
        w-full mt-4 px-6 py-3 rounded-lg font-semibold text-white transition-all
        ${isPending 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-black hover:bg-gray-800 active:scale-95'
        }
      `}
    >
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          {/* Simple CSS Spinner */}
          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Adding...
        </span>
      ) : (
        'Add to Cart'
      )}
    </button>
  );
}