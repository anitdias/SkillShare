"use client";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const AdminFeedback = dynamic(() => import("./admin-feedback"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-950">
        <motion.div
          className="w-12 h-12 border-4 border-t-transparent border-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
  ),
});

export default function AdminFeedbackPage() {
  return <AdminFeedback />;
}
