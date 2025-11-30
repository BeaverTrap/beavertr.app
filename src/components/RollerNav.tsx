"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";

interface Section {
  label: string;
  route: string;
}

interface RollerNavProps {
  sections: Section[];
}

const ITEM_HEIGHT = 180;

export default function RollerNav({ sections }: RollerNavProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  
  const y = useMotionValue(0);
  const springY = useSpring(y, { stiffness: 400, damping: 40 });

  // Repeat sections for infinite loop
  const extendedSections: Array<{ label: string; route: string; originalIndex: number }> = [];
  for (let i = 0; i < 5; i++) {
    sections.forEach((section, idx) => {
      extendedSections.push({
        ...section,
        originalIndex: idx,
      });
    });
  }

  const centerStart = Math.floor(extendedSections.length / 2);
  const loopSize = sections.length * ITEM_HEIGHT;

  // Track center position
  const [centerIndex, setCenterIndex] = useState(centerStart);

  // Handle seamless looping
  useMotionValueEvent(springY, "change", (latest) => {
    const newCenter = centerStart + Math.round(-latest / ITEM_HEIGHT);
    setCenterIndex(newCenter);
    
    // Reset position when reaching boundaries
    if (latest <= -loopSize) {
      y.set(latest + loopSize);
    } else if (latest >= 0) {
      y.set(latest - loopSize);
    }
  });

  // Handle scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (isScrolling.current) return;
      
      const delta = e.deltaY;
      if (Math.abs(delta) < 30) return;
      
      isScrolling.current = true;
      const direction = delta > 0 ? 1 : -1;
      
      setActiveIndex((prev) => (prev + direction + sections.length) % sections.length);
      
      const currentY = y.get();
      y.set(currentY - direction * ITEM_HEIGHT);
      
      setTimeout(() => {
        isScrolling.current = false;
      }, 350);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [sections.length, y]);

  // Initialize
  useEffect(() => {
    y.set(-centerStart * ITEM_HEIGHT);
  }, [y, centerStart]);

  const handleClick = (originalIndex: number, route: string) => {
    if (originalIndex === activeIndex) {
      router.push(route);
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-screen w-full flex items-center justify-center overflow-hidden bg-black"
    >
      <div className="relative h-full w-full flex items-center justify-center">
        <motion.div style={{ y: springY }} className="relative">
          {extendedSections.map((section, index) => {
            const originalIndex = section.originalIndex;
            const distance = Math.abs(index - centerIndex);
            const isActive = originalIndex === activeIndex && distance < 0.5;
            
            const scale = isActive ? 1.2 : Math.max(0.6, 1 - distance * 0.12);
            const opacity = isActive ? 1 : Math.max(0.3, 1 - distance * 0.18);
            const blur = isActive ? 0 : Math.min(10, distance * 0.8);

            return (
              <motion.div
                key={`${section.label}-${index}`}
                animate={{
                  scale,
                  opacity,
                  filter: `blur(${blur}px)`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 40,
                }}
                className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer"
                style={{
                  top: `${index * ITEM_HEIGHT}px`,
                  width: "100%",
                }}
                onClick={() => handleClick(originalIndex, section.route)}
              >
                <h1
                  className={`text-7xl md:text-9xl text-white whitespace-nowrap select-none ${
                    isActive ? "font-black" : "font-normal"
                  }`}
                >
                  {section.label}
                </h1>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
