"use client";

import { useState } from "react";
import * as React from "react";
import * as FaIcons from "react-icons/fa";
import * as FiIcons from "react-icons/fi";
import * as HiIcons from "react-icons/hi";
import * as MdIcons from "react-icons/md";
import * as IoIcons from "react-icons/io5";

// Curated list of ~50 popular, generic icons
const iconList = [
  // FontAwesome
  "FaGift", "FaHeart", "FaStar", "FaHome", "FaUser", "FaShoppingCart", "FaGamepad", "FaMusic", "FaCamera", "FaBook",
  "FaCar", "FaPlane", "FaBicycle", "FaLaptop", "FaMobile", "FaTv", "FaHeadphones", "FaDice", "FaPuzzlePiece", "FaRocket",
  // Feather
  "FiGift", "FiHeart", "FiStar", "FiHome", "FiUser", "FiShoppingCart", "FiMusic", "FiCamera", "FiBook", "FiTruck",
  "FiZap", "FiSun", "FiMoon", "FiCoffee", "FiShoppingBag", "FiTag", "FiBox", "FiPackage", "FiGrid", "FiLayers",
  // Heroicons
  "HiGift", "HiHeart", "HiStar", "HiHome", "HiUser", "HiShoppingCart", "HiMusicNote", "HiCamera", "HiBookOpen", "HiSparkles",
  "HiLightningBolt", "HiFire", "HiCube", "HiCollection", "HiTemplate", "HiViewGrid", "HiCubeTransparent", "HiPuzzle", "HiBeaker", "HiChip",
  // Material Design
  "MdGift", "MdFavorite", "MdStar", "MdHome", "MdPerson", "MdShoppingCart", "MdMusicNote", "MdCamera", "MdBook", "MdToys",
  "MdDirectionsCar", "MdFlight", "MdComputer", "MdPhone", "MdTv", "MdHeadset", "MdSportsEsports", "MdDiamond", "MdLocalMovies", "MdRestaurant",
  // Ionicons
  "IoGift", "IoHeart", "IoStar", "IoHome", "IoPerson", "IoCart", "IoMusicalNote", "IoCamera", "IoBook", "IoCarSport",
  "IoAirplane", "IoBicycle", "IoDesktop", "IoPhonePortrait", "IoTv", "IoHeadset", "IoGameController", "IoDiamond", "IoFilm", "IoRestaurant",
];

// Predefined colors
const colors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F43F5E", // Rose
];

interface IconColorPickerProps {
  selectedIcon: string | null;
  selectedColor: string | null;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
  showTrigger?: boolean; // If false, don't show the trigger button (for inline use)
  onClose?: () => void; // Callback when modal should close
}

export default function IconColorPicker({
  selectedIcon,
  selectedColor,
  onIconChange,
  onColorChange,
  showTrigger = true,
  onClose,
}: IconColorPickerProps) {
  const [showPicker, setShowPicker] = useState(!showTrigger); // Auto-open if no trigger
  const [tempIcon, setTempIcon] = useState<string | null>(selectedIcon);
  const [tempColor, setTempColor] = useState<string | null>(selectedColor);

  // Update temp values when selectedIcon/selectedColor change externally
  React.useEffect(() => {
    setTempIcon(selectedIcon);
    setTempColor(selectedColor);
  }, [selectedIcon, selectedColor]);

  const closePicker = () => {
    setShowPicker(false);
    if (onClose) onClose();
  };

  const getIconComponent = (iconName: string, size: number = 24) => {
    if (!iconName) return null;
    
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

  const handleIconSelect = (iconName: string) => {
    setTempIcon(iconName);
    // Don't call onIconChange yet - wait for Apply
  };

  const handleColorSelect = (color: string) => {
    setTempColor(color);
    // Don't call onColorChange yet - wait for Apply
  };

  const handleApply = () => {
    // Apply both changes at once
    if (tempIcon) onIconChange(tempIcon);
    if (tempColor) onColorChange(tempColor);
    closePicker();
  };

  const handleCancel = () => {
    // Reset to original values
    setTempIcon(selectedIcon);
    setTempColor(selectedColor);
    closePicker();
  };

  return (
    <>
      {/* Trigger Button (only if showTrigger is true) */}
      {showTrigger && (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors"
        >
          {selectedIcon ? (
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: selectedColor || "#3B82F6", color: "white" }}
            >
              {getIconComponent(selectedIcon, 14)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs">
              +
            </div>
          )}
          <span className="text-sm">{selectedIcon ? "Change" : "Icon"}</span>
        </button>
      )}

      {/* Popout Modal */}
      {showPicker && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            if (showTrigger) {
              closePicker();
            } else if (onClose) {
              onClose();
            }
          }}
        >
          <div 
            className="bg-zinc-900 rounded-xl p-6 max-w-xl w-full mx-4 border border-zinc-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Choose Icon & Color</h3>
              <button
                onClick={closePicker}
                className="text-zinc-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Icon Grid */}
            <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto mb-4 p-2 bg-zinc-800/30 rounded-lg">
              {iconList.map((iconName) => {
                const icon = getIconComponent(iconName, 20);
                if (!icon) return null;

                const isSelected = tempIcon === iconName;
                const displayColor = isSelected ? (tempColor || "#3B82F6") : undefined;

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleIconSelect(iconName)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? "ring-2 ring-blue-500 scale-110"
                        : "hover:bg-zinc-700 hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: displayColor,
                      color: isSelected ? "white" : "#9CA3AF",
                    }}
                    title={iconName.replace(/^[A-Z][a-z]/, "")}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Color Picker */}
            <div className="mb-4">
              <div className="text-xs text-zinc-400 mb-2">Color</div>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                      tempColor === color ? "ring-2 ring-white scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Preview & Apply/Cancel */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">Preview:</span>
                {tempIcon ? (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: tempColor || "#3B82F6", color: "white" }}
                  >
                    {getIconComponent(tempIcon, 20)}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
                    None
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
