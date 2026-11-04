import { Info, Monitor, PenLine, Wifi, type LucideIcon } from "lucide-react";

const EQUIPMENT_ICONS: Record<string, LucideIcon> = {
  "Wi-Fi": Wifi,
  Projector: Monitor,
  Whiteboard: PenLine,
};

export function getEquipmentIcon(label: string): LucideIcon {
  return EQUIPMENT_ICONS[label] ?? Info;
}
