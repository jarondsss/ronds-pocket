/**
 * Satu pintu untuk semua ikon app, dibangun dari CoreUI Icons (Linear).
 *
 * Kenapa lewat shim: nama-nama di bawah adalah nama yang sudah dipakai di
 * seluruh app, jadi komponen cukup ganti sumber import
 * (`lucide-react` -> `@/components/icons`) tanpa mengubah JSX-nya. Semua ikon
 * satu keluarga, ukuran tetap diatur lewat class (`size-4`, `size-5`, ...)
 * karena atribut width/height bawaan SVG kalah oleh utility Tailwind.
 */
import {
  cilAccountLogout,
  cilArrowBottom,
  cilArrowLeft,
  cilArrowRight,
  cilArrowTop,
  cilBank,
  cilBell,
  cilBolt,
  cilCalendar,
  cilCalendarCheck,
  cilCash,
  cilChartPie,
  cilCheck,
  cilCheckCircle,
  cilChevronBottom,
  cilChevronLeft,
  cilChevronRight,
  cilChevronTop,
  cilCircle,
  cilCopy,
  cilEnvelopeClosed,
  cilExternalLink,
  cilFlagAlt,
  cilGraph,
  cilHistory,
  cilHome,
  cilInfo,
  cilLightbulb,
  cilLockLocked,
  cilLoopCircular,
  cilMagnifyingGlass,
  cilMinus,
  cilMoney,
  cilMove,
  cilNotes,
  cilOptions,
  cilPencil,
  cilPeople,
  cilPlus,
  cilReload,
  cilShareAll,
  cilShieldAlt,
  cilSidebar,
  cilSpeedometer,
  cilStar,
  cilSwapHorizontal,
  cilTag,
  cilTrash,
  cilUser,
  cilUserPlus,
  cilUserUnfollow,
  cilUserX,
  cilWallet,
  cilWarning,
  cilX,
  cilXCircle,
} from "@coreui/icons";
import { cn } from "@/lib/utils";
import type { FC, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

/** Tipe ikon yang bisa dipakai sebagai nilai di array konfigurasi. */
export type IconComponent = FC<IconProps>;

/** CoreUI menyimpan tiap ikon sebagai [viewBox, isi SVG]. */
function icon(displayName: string, data: string[]): IconComponent {
  const [viewBox, body] = data;

  const Icon: IconComponent = ({ className, ...props }) => (
    <svg
      viewBox={`0 0 ${viewBox}`}
      width={16}
      height={16}
      focusable="false"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: body }}
      {...props}
    />
  );

  Icon.displayName = displayName;
  return Icon;
}

// Navigasi & arah
export const ArrowLeft = icon("ArrowLeft", cilArrowLeft);
export const ArrowRight = icon("ArrowRight", cilArrowRight);
export const ArrowDownLeft = icon("ArrowDownLeft", cilArrowBottom);
export const ArrowUpRight = icon("ArrowUpRight", cilArrowTop);
export const ArrowLeftRight = icon("ArrowLeftRight", cilSwapHorizontal);
export const ChevronLeft = icon("ChevronLeft", cilChevronLeft);
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = icon("ChevronRight", cilChevronRight);
export const ChevronRightIcon = ChevronRight;
export const ChevronUp = icon("ChevronUp", cilChevronTop);
export const ChevronUpIcon = ChevronUp;
export const ChevronDown = icon("ChevronDown", cilChevronBottom);
export const ChevronDownIcon = ChevronDown;
export const ChevronsUpDown = icon("ChevronsUpDown", cilChevronBottom);

// Tanda & status
export const Check = icon("Check", cilCheck);
export const CheckIcon = Check;
export const CircleCheckIcon = icon("CircleCheckIcon", cilCheckCircle);
export const CircleIcon = icon("CircleIcon", cilCircle);
export const MinusIcon = icon("MinusIcon", cilMinus);
export const X = icon("X", cilX);
export const XIcon = X;
export const OctagonXIcon = icon("OctagonXIcon", cilXCircle);
export const InfoIcon = icon("InfoIcon", cilInfo);
export const AlertTriangle = icon("AlertTriangle", cilWarning);
export const TriangleAlert = icon("TriangleAlert", cilWarning);
export const TriangleAlertIcon = TriangleAlert;
export const Loader2 = icon("Loader2", cilLoopCircular);
export const Loader2Icon = Loader2;

// Navigasi utama
export const Home = icon("Home", cilHome);
export const LayoutDashboard = icon("LayoutDashboard", cilSpeedometer);
export const Wallet = icon("Wallet", cilWallet);
export const WalletIcon = Wallet;
export const Receipt = icon("Receipt", cilNotes);
export const HandCoins = icon("HandCoins", cilCash);
export const PiggyBank = icon("PiggyBank", cilBank);
export const Target = icon("Target", cilFlagAlt);
export const ChartPie = icon("ChartPie", cilChartPie);
export const TrendingUp = icon("TrendingUp", cilGraph);
export const History = icon("History", cilHistory);
export const Coins = icon("Coins", cilMoney);
export const Lightbulb = icon("Lightbulb", cilLightbulb);

// Orang & berbagi
export const Users = icon("Users", cilPeople);
export const UserRound = icon("UserRound", cilUser);
export const UserPlus = icon("UserPlus", cilUserPlus);
export const UserMinus = icon("UserMinus", cilUserUnfollow);
export const UserX = icon("UserX", cilUserX);
export const Share2 = icon("Share2", cilShareAll);
export const Crown = icon("Crown", cilStar);
export const KeyRound = icon("KeyRound", cilTag);
export const LogOut = icon("LogOut", cilAccountLogout);

// Aksi
export const Plus = icon("Plus", cilPlus);
export const PencilLine = icon("PencilLine", cilPencil);
export const Trash2 = icon("Trash2", cilTrash);
export const Copy = icon("Copy", cilCopy);
export const SearchIcon = icon("SearchIcon", cilMagnifyingGlass);
export const RotateCcw = icon("RotateCcw", cilReload);
export const MoreHorizontal = icon("MoreHorizontal", cilOptions);
export const MoreHorizontalIcon = MoreHorizontal;
export const ExternalLink = icon("ExternalLink", cilExternalLink);
export const Bell = icon("Bell", cilBell);
export const Mail = icon("Mail", cilEnvelopeClosed);
export const Lock = icon("Lock", cilLockLocked);
export const ShieldCheck = icon("ShieldCheck", cilShieldAlt);
export const ShieldAlert = icon("ShieldAlert", cilWarning);
export const CalendarDays = icon("CalendarDays", cilCalendar);
export const CalendarClock = icon("CalendarClock", cilCalendarCheck);
export const Sparkles = icon("Sparkles", cilBolt);
export const PanelLeftIcon = icon("PanelLeftIcon", cilSidebar);
export const GripVerticalIcon = icon("GripVerticalIcon", cilMove);
