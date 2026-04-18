import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ToastContainer from "@/components/ui/Toast";

export default function MainLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}
