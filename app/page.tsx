"use client";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ThreeDMarqueeDemo() {
  const text = '<SkillShare/>';
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/profile');
    }
  }, [session, router]);

  const baseImages = [
    "/pics/radial.png",
    "/pics/recommendation.png",
    "/pics/roadmap.png",
    "/pics/skills.png",
    "/pics/skill-expanded.png",
    "/pics/manager.png",
    "/pics/competency.png",
    "/pics/goals.png",
  ];
  
  const images = [
    ...baseImages,
    ...baseImages.slice().reverse(),
    ...baseImages,
    ...baseImages.slice().reverse()
  ].slice(0, 40);

  return (
    <div className="relative mx-auto flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-3xl">
      <h1 className="text-4xl md:text-6xl font-bold font-mono text-white bg-gradient-to-br from-[#222222] via-[#2c3e50] to-[#0a66c2] shadow-md rounded-xl px-4 py-2 mb-6 h-[70px] font-mono z-40">
            {text}
          </h1>
      <h2 className="relative z-20 mx-auto max-w-4xl text-center text-2xl font-bold text-balance text-white md:text-4xl lg:text-6xl">
      Track, showcase, and grow your skills{" "}
        <span className="relative z-20 inline-block rounded-xl bg-blue-500/40 px-4 py-1 text-white underline decoration-sky-500 decoration-[6px] underline-offset-[16px] backdrop-blur-sm">
         in one
        </span>{" "}
         place
      </h2>
      <p className="relative z-20 mx-auto max-w-2xl py-8 text-center text-xl text-neutral-200 md:text-xl font-bold">
      Get Started Today
      </p>
 
      <div className="relative z-20 flex items-center justify-center gap-4 pt-4">
        <Link href="/signup">
          <button className="rounded-md bg-sky-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-black focus:outline-none">
            Join the club
          </button>
        </Link>
        <Link href="/login">
          <button className="rounded-md border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black focus:outline-none">
            Login
          </button>
        </Link>
      </div>
 
      {/* overlay */}
      <div className="absolute inset-0 z-10 h-full w-full bg-black/80 dark:bg-black/40" />
      <ThreeDMarquee
        className="pointer-events-none absolute inset-0 h-full w-full"
        images={images}
      />
    </div>
  );
}