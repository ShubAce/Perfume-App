import { pgTable, serial, text, integer, decimal, boolean, timestamp, json, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core"; // Add this import
import { AdapterAccount } from "@auth/core/adapters";

// --- 1. USERS TABLE ---
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	password: text("password"), // Nullable because Google users won't have a password
	role: text("role").default("customer"),
	image: text("image"), // Avatar from Google
	emailVerified: timestamp("emailVerified", { mode: "date" }),
	createdAt: timestamp("created_at").defaultNow(),
});

//and then the ACCOUNTS TABLE
export const accounts = pgTable(
	"accounts",
	{
		userId: integer("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("providerAccountId").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(account) => ({
		compoundKey: primaryKey({
			columns: [account.provider, account.providerAccountId],
		}),
	})
);

// --- 2. PRODUCTS TABLE (Perfume Specific) ---
export const products = pgTable("products", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").unique().notNull(), // For URLs like /product/chanel-no-5
	description: text("description"),
	price: decimal("price", { precision: 10, scale: 2 }).notNull(),
	originalPrice: decimal("original_price", { precision: 10, scale: 2 }), // For showing discounts
	stock: integer("stock").notNull().default(0),

	// Perfume Specific Fields
	brand: text("brand").notNull(),
	concentration: text("concentration"), // e.g., 'Eau de Parfum', 'Eau de Toilette'
	size: text("size"), // e.g., '50ml', '100ml'

	// Storing notes as JSON allows flexibility without complex join tables
	// Example: { top: ["Lemon"], middle: ["Rose"], base: ["Vanilla"] }
	scentNotes: json("scent_notes"),

	imageUrl: text("image_url"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
	gender: text("gender").notNull().default("unisex"), // 'men', 'women', 'unisex'
	isTrending: boolean("is_trending").default(false),
	isActive: boolean("is_active").default(true), // Soft delete / disable

	// Additional perfume metadata
	occasion: json("occasion"), // e.g., ["casual", "evening", "office"]
	longevity: text("longevity"), // e.g., "6-8 hours"
	projection: text("projection"), // e.g., "moderate", "heavy", "light"
});

// --- 3. ORDERS TABLE ---
export const orders = pgTable("orders", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").references(() => users.id), // Link to User
	totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
	status: text("status").default("pending"), // pending, paid, shipped, delivered
	stripePaymentId: text("stripe_payment_id"),
	createdAt: timestamp("created_at").defaultNow(),
});

// --- 4. ORDER ITEMS (Linking Orders to Products) ---
export const orderItems = pgTable("order_items", {
	id: serial("id").primaryKey(),
	orderId: integer("order_id")
		.references(() => orders.id)
		.notNull(),
	productId: integer("product_id")
		.references(() => products.id)
		.notNull(),
	quantity: integer("quantity").notNull(),
	priceAtPurchase: decimal("price_at_purchase", { precision: 10, scale: 2 }).notNull(), // Crucial: Price might change later, store what they paid!
});

// --- 5. RELATIONS (For Drizzle Query API) ---
// This lets you do db.query.users.findMany({ with: { orders: true } })

// ... existing imports

// --- 6. CARTS TABLE ---
export const carts = pgTable("carts", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").references(() => users.id), // Nullable: allows guest carts
	sessionToken: text("session_token"), // Store a cookie ID here for guests
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(), // Useful for cleaning up old abandoned carts
});

// --- 7. CART ITEMS TABLE ---
export const cartItems = pgTable("cart_items", {
	id: serial("id").primaryKey(),
	cartId: integer("cart_id")
		.references(() => carts.id)
		.notNull(),
	productId: integer("product_id")
		.references(() => products.id)
		.notNull(),
	quantity: integer("quantity").notNull().default(1),
	// Note: We DO NOT store price here.
	// Always fetch the *current* price from the 'products' table when displaying the cart.
});

// --- 8. CART RELATIONS ---
export const cartsRelations = relations(carts, ({ one, many }) => ({
	user: one(users, {
		fields: [carts.userId],
		references: [users.id],
	}),
	items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id],
	}),
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id],
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id],
	}),
	items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id],
	}),
}));

// --- 9. ADDRESSES TABLE ---
export const addresses = pgTable("addresses", {
	id: serial("id").primaryKey(),
	userId: integer("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	label: text("label").default("Home"), // Home, Work, etc.
	fullName: text("full_name").notNull(),
	phone: text("phone"),
	addressLine1: text("address_line_1").notNull(),
	addressLine2: text("address_line_2"),
	city: text("city").notNull(),
	state: text("state").notNull(),
	postalCode: text("postal_code").notNull(),
	country: text("country").notNull().default("USA"),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at").defaultNow(),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id],
	}),
}));

// --- 10. WISHLIST TABLE ---
export const wishlistItems = pgTable("wishlist_items", {
	id: serial("id").primaryKey(),
	userId: integer("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	productId: integer("product_id")
		.references(() => products.id, { onDelete: "cascade" })
		.notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
	user: one(users, {
		fields: [wishlistItems.userId],
		references: [users.id],
	}),
	product: one(products, {
		fields: [wishlistItems.productId],
		references: [products.id],
	}),
}));

// --- 11. USER PREFERENCES TABLE ---
export const userPreferences = pgTable("user_preferences", {
	id: serial("id").primaryKey(),
	userId: integer("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull()
		.unique(),
	preferredScentFamilies: json("preferred_scent_families"), // ["citrus", "woody", "floral"]
	favoriteBrands: json("favorite_brands"), // ["Chanel", "Dior"]
	preferredOccasions: json("preferred_occasions"), // ["daily", "evening", "special"]
	preferredMoods: json("preferred_moods"), // ["fresh", "romantic", "bold"]
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id],
	}),
}));

// --- 12. PASSWORD RESET TOKENS TABLE ---
export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: serial("id").primaryKey(),
	userId: integer("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	token: text("token").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id],
	}),
}));

// --- 13. AUDIT LOGS TABLE (Admin Activity Tracking) ---
export const auditLogs = pgTable("audit_logs", {
	id: serial("id").primaryKey(),
	adminId: integer("admin_id").references(() => users.id),
	action: text("action").notNull(), // e.g., 'ORDER_STATUS_CHANGE', 'REFUND_ISSUED', 'PRODUCT_UPDATE'
	entityType: text("entity_type").notNull(), // e.g., 'order', 'product', 'user'
	entityId: integer("entity_id"), // ID of affected entity
	details: json("details"), // Additional context as JSON
	ipAddress: text("ip_address"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	admin: one(users, {
		fields: [auditLogs.adminId],
		references: [users.id],
	}),
}));

// --- 14. COUPONS TABLE ---
export const coupons = pgTable("coupons", {
	id: serial("id").primaryKey(),
	code: text("code").notNull().unique(),
	discountType: text("discount_type").notNull(), // 'percentage' or 'flat'
	discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
	minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
	maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
	usageLimit: integer("usage_limit"),
	usedCount: integer("used_count").default(0),
	isActive: boolean("is_active").default(true),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").defaultNow(),
});

// --- 15. SUPPORT TICKETS TABLE ---
export const supportTickets = pgTable("support_tickets", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").references(() => users.id),
	orderId: integer("order_id").references(() => orders.id),
	subject: text("subject").notNull(),
	description: text("description").notNull(),
	status: text("status").default("open"), // open, in_progress, resolved, closed
	priority: text("priority").default("medium"), // low, medium, high, urgent
	assignedTo: integer("assigned_to").references(() => users.id),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
	user: one(users, {
		fields: [supportTickets.userId],
		references: [users.id],
	}),
	order: one(orders, {
		fields: [supportTickets.orderId],
		references: [orders.id],
	}),
	assignee: one(users, {
		fields: [supportTickets.assignedTo],
		references: [users.id],
	}),
}));

// Update users relations to include new tables
export const usersRelationsExtended = relations(users, ({ many, one }) => ({
	orders: many(orders),
	addresses: many(addresses),
	wishlistItems: many(wishlistItems),
	preferences: one(userPreferences),
}));
