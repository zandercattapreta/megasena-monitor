import { motion } from "motion/react";
import { Sun, Moon, Monitor, ChevronLeft } from "lucide-react";

interface SettingsPanelProps {
  onBack: () => void;
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  startWithSystem: boolean;
  onStartWithSystemChange: (value: boolean) => void;
}

export function SettingsPanel({
  onBack,
  theme,
  onThemeChange,
  startWithSystem,
  onStartWithSystemChange,
}: SettingsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#E5E7EB] dark:border-[#3A3A3A] flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2A] transition-colors mr-2"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-5 h-5 text-[#6B7280] dark:text-[#9CA3AF]" />
        </button>
        <h2 className="font-semibold text-[#1A1A1A] dark:text-white">
          Configurações
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Tema */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-3">
              Aparência
            </label>
            <div className="space-y-2">
              <button
                onClick={() => onThemeChange("light")}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                  ${
                    theme === "light"
                      ? "border-[#00A859] bg-[#E8F5E9] dark:bg-[#00A859]/10"
                      : "border-[#E5E7EB] dark:border-[#3A3A3A] hover:border-[#00A859]/50 dark:hover:border-[#00A859]/50"
                  }
                `}
              >
                <Sun className="w-5 h-5 text-[#F59E0B]" />
                <span className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                  Claro
                </span>
                {theme === "light" && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#00A859]" />
                )}
              </button>

              <button
                onClick={() => onThemeChange("dark")}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                  ${
                    theme === "dark"
                      ? "border-[#00A859] bg-[#E8F5E9] dark:bg-[#00A859]/10"
                      : "border-[#E5E7EB] dark:border-[#3A3A3A] hover:border-[#00A859]/50 dark:hover:border-[#00A859]/50"
                  }
                `}
              >
                <Moon className="w-5 h-5 text-[#6366F1]" />
                <span className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                  Escuro
                </span>
                {theme === "dark" && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#00A859]" />
                )}
              </button>

              <button
                onClick={() => onThemeChange("system")}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                  ${
                    theme === "system"
                      ? "border-[#00A859] bg-[#E8F5E9] dark:bg-[#00A859]/10"
                      : "border-[#E5E7EB] dark:border-[#3A3A3A] hover:border-[#00A859]/50 dark:hover:border-[#00A859]/50"
                  }
                `}
              >
                <Monitor className="w-5 h-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                <span className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                  Sistema
                </span>
                {theme === "system" && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#00A859]" />
                )}
              </button>
            </div>
          </div>

          {/* Iniciar com o sistema */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white">
                  Iniciar com o sistema
                </label>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                  Abrir automaticamente ao ligar o computador
                </p>
              </div>
              <button
                onClick={() => onStartWithSystemChange(!startWithSystem)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors flex-shrink-0
                  ${
                    startWithSystem
                      ? "bg-[#00A859]"
                      : "bg-[#E5E7EB] dark:bg-[#3A3A3A]"
                  }
                `}
                aria-label={`Iniciar com o sistema: ${startWithSystem ? "ativado" : "desativado"}`}
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ left: startWithSystem ? "22px" : "2px" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}