import { Suspense } from "react";
import RoadMap from "./roadmap";
import { motion } from "framer-motion";

export default function PublicProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#222222] via-[#333333] to-[#444444]">
      {/* Animated Background Overlay */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage: "radial-gradient(circle at center, #3b3b3b 0%, transparent 80%)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* Glassmorphic Loading Container */}
      <div className="relative p-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg flex flex-col items-center">
        {/* Spinner Animation */}
        <motion.div
          className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {/* Loading Text (Fixed easing function) */}
        <motion.p
          className="mt-4 text-lg font-semibold text-white/90 tracking-wide"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} // Fixed this!
        >
          Loading, please wait...
        </motion.p>
      </div>
    </div>}>
      <RoadMap />
    </Suspense>
  );
}
