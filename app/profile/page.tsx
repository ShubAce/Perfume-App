import { auth } from "@/auth";
import { db } from "@/src/index";
import { orders } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { createTestOrder } from "@/app/actions/test-order"; // We will create this next

export default async function ProfilePage() {
  // 1. Protect the Route
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id!);

  // 2. Fetch Orders
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      items: {
        with: {
          product: true,
        },
      },
    },
    orderBy: [desc(orders.createdAt)], // Newest first
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
            <p className="mt-2 text-gray-500">
              Welcome back, <span className="font-semibold text-black">{session.user.name}</span>
            </p>
          </div>
          
          {/* Temporary Button to test this page */}
          <form action={createTestOrder}>
            <button className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md transition-colors">
              + Generate Test Order
            </button>
          </form>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6">Order History</h2>

        {userOrders.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get yourself something nice today.</p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {userOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                {/* Order Header */}
                <div className="flex items-center border-b border-gray-100 bg-gray-50/50 p-4 sm:p-6 gap-x-8">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Order #{order.id}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown Date'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">Total</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">${order.totalAmount}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1
                      ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'}
                    `}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <ul className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <li key={item.id} className="p-4 sm:p-6">
                      <div className="flex items-center sm:items-start">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 border border-gray-200 relative">
                          {item.product.imageUrl ? (
                             <Image 
                               src={item.product.imageUrl} 
                               alt={item.product.name} 
                               fill 
                               className="object-cover"
                             />
                          ) : (
                             <div className="flex h-full items-center justify-center text-xs text-gray-500">Img</div>
                          )}
                        </div>
                        <div className="ml-6 flex-1 text-sm">
                          <div className="font-medium text-gray-900 sm:flex sm:justify-between">
                            <h5>{item.product.name}</h5>
                            <p className="mt-2 sm:mt-0">${item.priceAtPurchase}</p>
                          </div>
                          <p className="hidden text-gray-500 sm:block sm:mt-2">{item.product.brand}</p>
                          <p className="mt-2 text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}