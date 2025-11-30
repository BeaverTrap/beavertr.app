// Utility to get random icon and color for wishlists

// Curated list of ~50 popular, generic icons (same as IconColorPicker)
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

// Predefined colors (same as IconColorPicker)
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

export function getRandomIcon(): string {
  return iconList[Math.floor(Math.random() * iconList.length)];
}

export function getRandomColor(): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomIconAndColor(): { icon: string; color: string } {
  return {
    icon: getRandomIcon(),
    color: getRandomColor(),
  };
}

