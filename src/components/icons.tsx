/**
 * Satu pintu untuk semua ikon app, dibangun dari Lucide (garis tipis 24x24).
 *
 * Kenapa lewat shim: nama-nama di bawah adalah nama yang sudah dipakai di
 * seluruh app, jadi komponen cukup ganti sumber import
 * (`lucide-react` -> `@/components/icons`) tanpa mengubah JSX-nya.
 *
 * `@coreui/icons` (yang dipakai sebelumnya) berupa glyph terisi, sementara
 * acuan desain memakai ikon garis tipis. Lucide juga tree-shake, jadi bundle
 * tetap kecil: hanya ikon yang benar-benar dipakai yang ikut ter-bundle.
 *
 * Catatan: semua nama ikon di-import dengan awalan `Lucide` supaya nama
 * ekspor di bawah tidak bentrok dengan impor aslinya.
 *
 * Lisensi: Lucide (ISC), lihat https://lucide.dev
 */
import {
  ArrowDownLeft as LucideArrowDownLeft,
  ArrowLeft as LucideArrowLeft,
  ArrowLeftRight as LucideArrowLeftRight,
  ArrowRight as LucideArrowRight,
  ArrowUpRight as LucideArrowUpRight,
  Bell as LucideBell,
  CalendarCheck as LucideCalendarCheck,
  CalendarDays as LucideCalendarDays,
  ChartPie as LucideChartPie,
  Check as LucideCheck,
  ChevronDown as LucideChevronDown,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  ChevronUp as LucideChevronUp,
  ChevronsUpDown as LucideChevronsUpDown,
  Circle as LucideCircle,
  CircleCheck as LucideCircleCheck,
  CircleX as LucideCircleX,
  Coins as LucideCoins,
  Copy as LucideCopy,
  Crown as LucideCrown,
  Download as LucideDownload,
  Ellipsis as LucideEllipsis,
  ExternalLink as LucideExternalLink,
  GripVertical as LucideGripVertical,
  HandCoins as LucideHandCoins,
  History as LucideHistory,
  Home as LucideHome,
  Info as LucideInfo,
  KeyRound as LucideKeyRound,
  Landmark as LucideLandmark,
  LayoutDashboard as LucideLayoutDashboard,
  Lightbulb as LucideLightbulb,
  LoaderCircle as LucideLoaderCircle,
  Lock as LucideLock,
  LogOut as LucideLogOut,
  Mail as LucideMail,
  MessageCircle as LucideMessageCircle,
  Minus as LucideMinus,
  PanelLeft as LucidePanelLeft,
  Pencil as LucidePencil,
  PiggyBank as LucidePiggyBank,
  Play as LucidePlay,
  Plus as LucidePlus,
  Pause as LucidePause,
  Receipt as LucideReceipt,
  Repeat as LucideRepeat,
  RotateCcw as LucideRotateCcw,
  Scale as LucideScale,
  Search as LucideSearch,
  Send as LucideSend,
  Share2 as LucideShare2,
  ShieldAlert as LucideShieldAlert,
  ShieldCheck as LucideShieldCheck,
  Sparkles as LucideSparkles,
  Target as LucideTarget,
  Trash2 as LucideTrash2,
  TrendingUp as LucideTrendingUp,
  TriangleAlert as LucideTriangleAlert,
  User as LucideUser,
  UserMinus as LucideUserMinus,
  UserPlus as LucideUserPlus,
  UserX as LucideUserX,
  Users as LucideUsers,
  Wallet as LucideWallet,
  WifiOff as LucideWifiOff,
  Moon as LucideMoon,
  Sun as LucideSun,
  X as LucideX,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { forwardRef } from "react";

export type IconProps = LucideProps;

/** Tipe ikon yang bisa dipakai sebagai nilai di array konfigurasi. */
export type IconComponent = LucideIcon;

/**
 * Bungkus ikon Lucide supaya ukuran default-nya 18px dan bisa dikecilkan
 * lewat class Tailwind (`size-4`, `size-5`, ...) seperti sebelumnya.
 */
function icon(name: string, Glyph: LucideIcon): IconComponent {
  const Wrapped = forwardRef<SVGSVGElement, IconProps>(
    ({ size = 18, strokeWidth = 1.75, className, ...props }, ref) => (
      <Glyph
        ref={ref}
        size={size}
        strokeWidth={strokeWidth}
        aria-hidden="true"
        className={className}
        {...props}
      />
    ),
  );
  Wrapped.displayName = name;
  return Wrapped;
}

// Navigasi & arah
export const ArrowLeft = icon("ArrowLeft", LucideArrowLeft);
export const ArrowRight = icon("ArrowRight", LucideArrowRight);
export const ArrowDownLeft = icon("ArrowDownLeft", LucideArrowDownLeft);
export const ArrowUpRight = icon("ArrowUpRight", LucideArrowUpRight);
export const ArrowLeftRight = icon("ArrowLeftRight", LucideArrowLeftRight);
export const ChevronLeft = icon("ChevronLeft", LucideChevronLeft);
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = icon("ChevronRight", LucideChevronRight);
export const ChevronRightIcon = ChevronRight;
export const ChevronUp = icon("ChevronUp", LucideChevronUp);
export const ChevronUpIcon = ChevronUp;
export const ChevronDown = icon("ChevronDown", LucideChevronDown);
export const ChevronDownIcon = ChevronDown;
export const ChevronsUpDown = icon("ChevronsUpDown", LucideChevronsUpDown);

// Tanda & status
export const Check = icon("Check", LucideCheck);
export const CheckIcon = Check;
export const CircleCheckIcon = icon("CircleCheckIcon", LucideCircleCheck);
export const CircleIcon = icon("CircleIcon", LucideCircle);
export const MinusIcon = icon("MinusIcon", LucideMinus);
export const X = icon("X", LucideX);
export const XIcon = X;
export const OctagonXIcon = icon("OctagonXIcon", LucideCircleX);
export const InfoIcon = icon("InfoIcon", LucideInfo);
export const AlertTriangle = icon("AlertTriangle", LucideTriangleAlert);
export const TriangleAlert = icon("TriangleAlert", LucideTriangleAlert);
export const TriangleAlertIcon = TriangleAlert;
export const Loader2 = icon("Loader2", LucideLoaderCircle);
export const Loader2Icon = Loader2;

// Navigasi utama
export const Home = icon("Home", LucideHome);
export const LayoutDashboard = icon("LayoutDashboard", LucideLayoutDashboard);
export const Wallet = icon("Wallet", LucideWallet);
export const WalletIcon = Wallet;
export const Receipt = icon("Receipt", LucideReceipt);
export const HandCoins = icon("HandCoins", LucideHandCoins);
export const PiggyBank = icon("PiggyBank", LucidePiggyBank);
export const Target = icon("Target", LucideTarget);
export const ChartPie = icon("ChartPie", LucideChartPie);
export const TrendingUp = icon("TrendingUp", LucideTrendingUp);
export const History = icon("History", LucideHistory);
export const Coins = icon("Coins", LucideCoins);
export const Lightbulb = icon("Lightbulb", LucideLightbulb);

// Orang & berbagi
export const Users = icon("Users", LucideUsers);
export const UserRound = icon("UserRound", LucideUser);
export const UserPlus = icon("UserPlus", LucideUserPlus);
export const UserMinus = icon("UserMinus", LucideUserMinus);
export const UserX = icon("UserX", LucideUserX);
export const Share2 = icon("Share2", LucideShare2);
export const Crown = icon("Crown", LucideCrown);
export const KeyRound = icon("KeyRound", LucideKeyRound);
export const LogOut = icon("LogOut", LucideLogOut);

// Aksi
export const Plus = icon("Plus", LucidePlus);
export const PencilLine = icon("PencilLine", LucidePencil);
export const Trash2 = icon("Trash2", LucideTrash2);
export const Copy = icon("Copy", LucideCopy);
export const SearchIcon = icon("SearchIcon", LucideSearch);
export const Send = icon("Send", LucideSend);
export const RotateCcw = icon("RotateCcw", LucideRotateCcw);
export const Landmark = icon("Landmark", LucideLandmark);
export const Scale = icon("Scale", LucideScale);
export const MoreHorizontal = icon("MoreHorizontal", LucideEllipsis);
export const MoreHorizontalIcon = MoreHorizontal;
export const ExternalLink = icon("ExternalLink", LucideExternalLink);
export const Bell = icon("Bell", LucideBell);
export const Mail = icon("Mail", LucideMail);
export const MessageCircle = icon("MessageCircle", LucideMessageCircle);
export const Lock = icon("Lock", LucideLock);
export const ShieldCheck = icon("ShieldCheck", LucideShieldCheck);
export const ShieldAlert = icon("ShieldAlert", LucideShieldAlert);
export const CalendarDays = icon("CalendarDays", LucideCalendarDays);
export const CalendarClock = icon("CalendarClock", LucideCalendarCheck);
export const Sparkles = icon("Sparkles", LucideSparkles);
export const PanelLeftIcon = icon("PanelLeftIcon", LucidePanelLeft);
export const GripVerticalIcon = icon("GripVerticalIcon", LucideGripVertical);
export const Moon = icon("Moon", LucideMoon);
export const Sun = icon("Sun", LucideSun);
export const Download = icon("Download", LucideDownload);
export const Repeat = icon("Repeat", LucideRepeat);
export const Play = icon("Play", LucidePlay);
export const Pause = icon("Pause", LucidePause);
export const WifiOff = icon("WifiOff", LucideWifiOff);
