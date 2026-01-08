"use client";

import { useState } from "react";
import { Settings, Shield, Bell, Mail, Globe, CreditCard, Truck, Lock, Save, Check, AlertTriangle } from "lucide-react";

interface Props {
	isSuperAdmin: boolean;
}

export default function SettingsClient({ isSuperAdmin }: Props) {
	const [activeTab, setActiveTab] = useState("general");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const tabs = [
		{ id: "general", label: "General", icon: Settings },
		{ id: "notifications", label: "Notifications", icon: Bell },
		{ id: "shipping", label: "Shipping", icon: Truck },
		{ id: "payments", label: "Payments", icon: CreditCard },
		...(isSuperAdmin ? [{ id: "security", label: "Security", icon: Shield }] : []),
	];

	const handleSave = async () => {
		setSaving(true);
		// Simulate save
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setSaving(false);
		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	};

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Settings</h1>
					<p className="text-gray-500 mt-1">Manage your store configuration</p>
				</div>
				<button
					onClick={handleSave}
					disabled={saving}
					className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
				>
					{saving ? (
						<>
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Saving...
						</>
					) : saved ? (
						<>
							<Check className="w-4 h-4" />
							Saved!
						</>
					) : (
						<>
							<Save className="w-4 h-4" />
							Save Changes
						</>
					)}
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Tabs */}
				<div className="lg:col-span-1">
					<nav className="space-y-1">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
										activeTab === tab.id ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
									}`}
								>
									<Icon className="w-5 h-5" />
									{tab.label}
								</button>
							);
						})}
					</nav>
				</div>

				{/* Content */}
				<div className="lg:col-span-3 bg-white rounded-xl border shadow-sm p-6">
					{activeTab === "general" && (
						<div className="space-y-6">
							<h2 className="text-lg font-semibold text-gray-900">General Settings</h2>

							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
									<input
										type="text"
										defaultValue="Perfume Shop"
										className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Store Description</label>
									<textarea
										rows={3}
										defaultValue="Premium fragrances and perfumes for every occasion."
										className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
									<input
										type="email"
										defaultValue="support@perfumeshop.com"
										className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
									<select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
										<option value="INR">INR (₹)</option>
										<option value="USD">USD ($)</option>
										<option value="EUR">EUR (€)</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
									<select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
										<option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
										<option value="America/New_York">America/New_York (EST)</option>
										<option value="Europe/London">Europe/London (GMT)</option>
									</select>
								</div>
							</div>
						</div>
					)}

					{activeTab === "notifications" && (
						<div className="space-y-6">
							<h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>

							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div>
										<p className="font-medium text-gray-900">New Order Notifications</p>
										<p className="text-sm text-gray-500">Get notified when a new order is placed</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											defaultChecked
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>

								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div>
										<p className="font-medium text-gray-900">Low Stock Alerts</p>
										<p className="text-sm text-gray-500">Get notified when products are low in stock</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											defaultChecked
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>

								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div>
										<p className="font-medium text-gray-900">Customer Review Notifications</p>
										<p className="text-sm text-gray-500">Get notified when customers leave reviews</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
									<input
										type="number"
										defaultValue={10}
										className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
									/>
									<p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
								</div>
							</div>
						</div>
					)}

					{activeTab === "shipping" && (
						<div className="space-y-6">
							<h2 className="text-lg font-semibold text-gray-900">Shipping Settings</h2>

							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold (₹)</label>
									<input
										type="number"
										defaultValue={999}
										className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
									/>
									<p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Standard Shipping Fee (₹)</label>
									<input
										type="number"
										defaultValue={49}
										className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Express Shipping Fee (₹)</label>
									<input
										type="number"
										defaultValue={99}
										className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery (Standard)</label>
									<input
										type="text"
										defaultValue="5-7 business days"
										className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery (Express)</label>
									<input
										type="text"
										defaultValue="2-3 business days"
										className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
									/>
								</div>
							</div>
						</div>
					)}

					{activeTab === "payments" && (
						<div className="space-y-6">
							<h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>

							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
											<CreditCard className="w-5 h-5 text-blue-600" />
										</div>
										<div>
											<p className="font-medium text-gray-900">Credit/Debit Cards</p>
											<p className="text-sm text-gray-500">Accept Visa, Mastercard, RuPay</p>
										</div>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											defaultChecked
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>

								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
											<Globe className="w-5 h-5 text-green-600" />
										</div>
										<div>
											<p className="font-medium text-gray-900">UPI Payments</p>
											<p className="text-sm text-gray-500">GPay, PhonePe, Paytm, etc.</p>
										</div>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											defaultChecked
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>

								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
											<Truck className="w-5 h-5 text-orange-600" />
										</div>
										<div>
											<p className="font-medium text-gray-900">Cash on Delivery</p>
											<p className="text-sm text-gray-500">Pay when you receive</p>
										</div>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											defaultChecked
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>
							</div>
						</div>
					)}

					{activeTab === "security" && isSuperAdmin && (
						<div className="space-y-6">
							<div className="flex items-center gap-2">
								<h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
								<span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Super Admin Only</span>
							</div>

							<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
								<AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
								<div>
									<p className="font-medium text-yellow-800">Caution</p>
									<p className="text-sm text-yellow-700">
										Changes to security settings can affect all admin users. Proceed with care.
									</p>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div>
										<p className="font-medium text-gray-900">Two-Factor Authentication</p>
										<p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>

								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div>
										<p className="font-medium text-gray-900">Session Timeout</p>
										<p className="text-sm text-gray-500">Auto-logout after inactivity</p>
									</div>
									<select className="px-3 py-2 border rounded-lg text-sm">
										<option value="30">30 minutes</option>
										<option value="60">1 hour</option>
										<option value="120">2 hours</option>
										<option value="480">8 hours</option>
									</select>
								</div>

								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div>
										<p className="font-medium text-gray-900">IP Whitelist</p>
										<p className="text-sm text-gray-500">Restrict admin access to specific IPs</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
									</label>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Password Policy</label>
									<select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
										<option value="standard">Standard (8+ characters)</option>
										<option value="strong">Strong (12+ chars, mixed case, numbers)</option>
										<option value="strict">Strict (16+ chars, special characters required)</option>
									</select>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
