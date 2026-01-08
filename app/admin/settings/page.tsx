import { validateAdminAccess, ADMIN_ROLES } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
	const { authorized, session } = await validateAdminAccess("settings");

	if (!authorized) {
		redirect("/login?callbackUrl=/admin/settings");
	}

	const isSuperAdmin = session?.user?.role === ADMIN_ROLES.SUPER_ADMIN;

	return <SettingsClient isSuperAdmin={isSuperAdmin} />;
}
