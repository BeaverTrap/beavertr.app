"use client";

import * as FaIcons from "react-icons/fa";
import * as FiIcons from "react-icons/fi";
import * as HiIcons from "react-icons/hi";
import * as MdIcons from "react-icons/md";
import * as IoIcons from "react-icons/io5";

interface WishlistIconProps {
  icon: string | null;
  color: string | null;
  size?: number;
  className?: string;
}

export default function WishlistIcon({ icon, color, size = 24, className = "" }: WishlistIconProps) {
  if (!icon) return null;

  const getIconComponent = (iconName: string) => {
    if (!iconName) return null;
    
    // Icon name format: "FaGift", "FiHeart", etc.
    if (iconName.startsWith("Fa") && FaIcons[iconName as keyof typeof FaIcons]) {
      const Icon = FaIcons[iconName as keyof typeof FaIcons] as React.ComponentType<any>;
      return <Icon size={size} />;
    }
    if (iconName.startsWith("Fi") && FiIcons[iconName as keyof typeof FiIcons]) {
      const Icon = FiIcons[iconName as keyof typeof FiIcons] as React.ComponentType<any>;
      return <Icon size={size} />;
    }
    if (iconName.startsWith("Hi") && HiIcons[iconName as keyof typeof HiIcons]) {
      const Icon = HiIcons[iconName as keyof typeof HiIcons] as React.ComponentType<any>;
      return <Icon size={size} />;
    }
    if (iconName.startsWith("Md") && MdIcons[iconName as keyof typeof MdIcons]) {
      const Icon = MdIcons[iconName as keyof typeof MdIcons] as React.ComponentType<any>;
      return <Icon size={size} />;
    }
    if (iconName.startsWith("Io") && IoIcons[iconName as keyof typeof IoIcons]) {
      const Icon = IoIcons[iconName as keyof typeof IoIcons] as React.ComponentType<any>;
      return <Icon size={size} />;
    }
    return null;
  };

  const iconComponent = getIconComponent(icon);
  if (!iconComponent) return null;

  return (
    <div
      className={`rounded-lg flex items-center justify-center ${className}`}
      style={{ 
        backgroundColor: color || "#3B82F6",
        color: "white",
        width: size + 8,
        height: size + 8,
      }}
    >
      {iconComponent}
    </div>
  );
}

