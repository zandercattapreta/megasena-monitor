import { motion } from "motion/react";

interface NumberSphereProps {
  number: number;
  selected?: boolean;
  hit?: boolean;
  miss?: boolean;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  disabled?: boolean;
}

export function NumberSphere({
  number,
  selected = false,
  hit = false,
  miss = false,
  size = "large",
  onClick,
  disabled = false,
}: NumberSphereProps) {
  const sizeClasses = {
    small: "w-6 h-6 text-[10px]",
    medium: "w-8 h-8 text-xs",
    large: "w-9 h-9 text-sm",
  };

  const getStyles = () => {
    if (miss) {
      return "bg-[#9CA3AF] text-white border-[#9CA3AF]";
    }
    if (hit) {
      return "bg-[#00A859] text-white border-[#006B3C] shadow-[0_0_12px_rgba(0,168,89,0.6)]";
    }
    if (selected) {
      return "bg-[#00A859] text-white border-[#006B3C] shadow-[0_2px_8px_rgba(0,168,89,0.3)]";
    }
    return "bg-white text-[#1A1A1A] border-[#E5E7EB] hover:border-[#00A859]";
  };

  const formattedNumber = number.toString().padStart(2, "0");

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        rounded-full
        border-2
        flex items-center justify-center
        font-bold
        transition-all duration-200
        ${getStyles()}
        ${onClick && !disabled ? "cursor-pointer hover:scale-105" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      whileTap={onClick && !disabled ? { scale: 0.95 } : {}}
      initial={false}
      animate={{ scale: 1 }}
      aria-label={`Número ${formattedNumber}, ${selected ? "selecionado" : "não selecionado"}`}
    >
      {formattedNumber}
    </motion.button>
  );
}