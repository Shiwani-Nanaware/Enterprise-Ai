/**
 * AuthLayout — thin wrapper that renders its children via <Outlet />.
 * The login page itself contains the full split-panel design.
 */

import { Outlet } from "react-router-dom";
import { ToastContainer } from "@/components/ui/toast";

export function AuthLayout() {
  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  );
}
