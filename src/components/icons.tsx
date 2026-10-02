/**
 * Satu pintu untuk semua ikon app, dibangun dari CoreUI Icons (Linear).
 *
 * Kenapa lewat shim: nama-nama di bawah adalah nama yang sudah dipakai di
 * seluruh app, jadi komponen cukup ganti sumber import
 * (`lucide-react` -> `@/components/icons`) tanpa mengubah JSX-nya. Semua ikon
 * satu keluarga, ukuran tetap diatur lewat class (`size-4`, `size-5`, ...)
 * karena atribut width/height bawaan SVG kalah oleh utility Tailwind.
 *
 * Catatan soal ukuran bundle: tiap ikon di-import dari file SVG-nya langsung
 * (`.../svg/free/cil-*.svg?raw`), bukan dari pintu utama `@coreui/icons`.
 * Pintu utamanya menarik 1591 ikon (brand + flag + free) jadi satu file ~4,8 MB
 * dan bikin halaman kosong lama.
 *
 * Lisensi: ikon dari CoreUI Icons Free (CC BY 4.0), lihat
 * https://github.com/coreui/coreui-icons
 */
import accountLogoutSvg from "@coreui/icons/svg/free/cil-account-logout.svg?raw";
import arrowBottomSvg from "@coreui/icons/svg/free/cil-arrow-bottom.svg?raw";
import arrowLeftSvg from "@coreui/icons/svg/free/cil-arrow-left.svg?raw";
import arrowRightSvg from "@coreui/icons/svg/free/cil-arrow-right.svg?raw";
import arrowTopSvg from "@coreui/icons/svg/free/cil-arrow-top.svg?raw";
import bankSvg from "@coreui/icons/svg/free/cil-bank.svg?raw";
import bellSvg from "@coreui/icons/svg/free/cil-bell.svg?raw";
import boltSvg from "@coreui/icons/svg/free/cil-bolt.svg?raw";
import calendarCheckSvg from "@coreui/icons/svg/free/cil-calendar-check.svg?raw";
import calendarSvg from "@coreui/icons/svg/free/cil-calendar.svg?raw";
import cashSvg from "@coreui/icons/svg/free/cil-cash.svg?raw";
import chartPieSvg from "@coreui/icons/svg/free/cil-chart-pie.svg?raw";
import checkCircleSvg from "@coreui/icons/svg/free/cil-check-circle.svg?raw";
import checkSvg from "@coreui/icons/svg/free/cil-check.svg?raw";
import chevronBottomSvg from "@coreui/icons/svg/free/cil-chevron-bottom.svg?raw";
import chevronLeftSvg from "@coreui/icons/svg/free/cil-chevron-left.svg?raw";
import chevronRightSvg from "@coreui/icons/svg/free/cil-chevron-right.svg?raw";
import chevronTopSvg from "@coreui/icons/svg/free/cil-chevron-top.svg?raw";
import circleSvg from "@coreui/icons/svg/free/cil-circle.svg?raw";
import copySvg from "@coreui/icons/svg/free/cil-copy.svg?raw";
import envelopeClosedSvg from "@coreui/icons/svg/free/cil-envelope-closed.svg?raw";
import externalLinkSvg from "@coreui/icons/svg/free/cil-external-link.svg?raw";
import flagAltSvg from "@coreui/icons/svg/free/cil-flag-alt.svg?raw";
import graphSvg from "@coreui/icons/svg/free/cil-graph.svg?raw";
import historySvg from "@coreui/icons/svg/free/cil-history.svg?raw";
import homeSvg from "@coreui/icons/svg/free/cil-home.svg?raw";
import infoSvg from "@coreui/icons/svg/free/cil-info.svg?raw";
import lightbulbSvg from "@coreui/icons/svg/free/cil-lightbulb.svg?raw";
import lockLockedSvg from "@coreui/icons/svg/free/cil-lock-locked.svg?raw";
import loopCircularSvg from "@coreui/icons/svg/free/cil-loop-circular.svg?raw";
import magnifyingGlassSvg from "@coreui/icons/svg/free/cil-magnifying-glass.svg?raw";
import minusSvg from "@coreui/icons/svg/free/cil-minus.svg?raw";
import moneySvg from "@coreui/icons/svg/free/cil-money.svg?raw";
import moveSvg from "@coreui/icons/svg/free/cil-move.svg?raw";
import notesSvg from "@coreui/icons/svg/free/cil-notes.svg?raw";
import optionsSvg from "@coreui/icons/svg/free/cil-options.svg?raw";
import pencilSvg from "@coreui/icons/svg/free/cil-pencil.svg?raw";
import peopleSvg from "@coreui/icons/svg/free/cil-people.svg?raw";
import plusSvg from "@coreui/icons/svg/free/cil-plus.svg?raw";
import reloadSvg from "@coreui/icons/svg/free/cil-reload.svg?raw";
import shareAllSvg from "@coreui/icons/svg/free/cil-share-all.svg?raw";
import shieldAltSvg from "@coreui/icons/svg/free/cil-shield-alt.svg?raw";
import sidebarSvg from "@coreui/icons/svg/free/cil-sidebar.svg?raw";
import speedometerSvg from "@coreui/icons/svg/free/cil-speedometer.svg?raw";
import starSvg from "@coreui/icons/svg/free/cil-star.svg?raw";
import swapHorizontalSvg from "@coreui/icons/svg/free/cil-swap-horizontal.svg?raw";
import tagSvg from "@coreui/icons/svg/free/cil-tag.svg?raw";
import trashSvg from "@coreui/icons/svg/free/cil-trash.svg?raw";
import userPlusSvg from "@coreui/icons/svg/free/cil-user-plus.svg?raw";
import userUnfollowSvg from "@coreui/icons/svg/free/cil-user-unfollow.svg?raw";
import userXSvg from "@coreui/icons/svg/free/cil-user-x.svg?raw";
import userSvg from "@coreui/icons/svg/free/cil-user.svg?raw";
import walletSvg from "@coreui/icons/svg/free/cil-wallet.svg?raw";
import warningSvg from "@coreui/icons/svg/free/cil-warning.svg?raw";
import xCircleSvg from "@coreui/icons/svg/free/cil-x-circle.svg?raw";
import xSvg from "@coreui/icons/svg/free/cil-x.svg?raw";
import { cn } from "@/lib/utils";
import type { FC, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

/** Tipe ikon yang bisa dipakai sebagai nilai di array konfigurasi. */
export type IconComponent = FC<IconProps>;

/** Pisahkan viewBox dan isi dari file SVG mentah. */
function parseSvg(svg: string) {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? "0 0 512 512";
  const body = svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
  return { viewBox, body };
}

function icon(displayName: string, svg: string): IconComponent {
  const { viewBox, body } = parseSvg(svg);

  const Icon: IconComponent = ({ className, ...props }) => (
    <svg
      viewBox={viewBox}
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
export const ArrowLeft = icon("ArrowLeft", arrowLeftSvg);
export const ArrowRight = icon("ArrowRight", arrowRightSvg);
export const ArrowDownLeft = icon("ArrowDownLeft", arrowBottomSvg);
export const ArrowUpRight = icon("ArrowUpRight", arrowTopSvg);
export const ArrowLeftRight = icon("ArrowLeftRight", swapHorizontalSvg);
export const ChevronLeft = icon("ChevronLeft", chevronLeftSvg);
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = icon("ChevronRight", chevronRightSvg);
export const ChevronRightIcon = ChevronRight;
export const ChevronUp = icon("ChevronUp", chevronTopSvg);
export const ChevronUpIcon = ChevronUp;
export const ChevronDown = icon("ChevronDown", chevronBottomSvg);
export const ChevronDownIcon = ChevronDown;
export const ChevronsUpDown = icon("ChevronsUpDown", chevronBottomSvg);

// Tanda & status
export const Check = icon("Check", checkSvg);
export const CheckIcon = Check;
export const CircleCheckIcon = icon("CircleCheckIcon", checkCircleSvg);
export const CircleIcon = icon("CircleIcon", circleSvg);
export const MinusIcon = icon("MinusIcon", minusSvg);
export const X = icon("X", xSvg);
export const XIcon = X;
export const OctagonXIcon = icon("OctagonXIcon", xCircleSvg);
export const InfoIcon = icon("InfoIcon", infoSvg);
export const AlertTriangle = icon("AlertTriangle", warningSvg);
export const TriangleAlert = icon("TriangleAlert", warningSvg);
export const TriangleAlertIcon = TriangleAlert;
export const Loader2 = icon("Loader2", loopCircularSvg);
export const Loader2Icon = Loader2;

// Navigasi utama
export const Home = icon("Home", homeSvg);
export const LayoutDashboard = icon("LayoutDashboard", speedometerSvg);
export const Wallet = icon("Wallet", walletSvg);
export const WalletIcon = Wallet;
export const Receipt = icon("Receipt", notesSvg);
export const HandCoins = icon("HandCoins", cashSvg);
export const PiggyBank = icon("PiggyBank", bankSvg);
export const Target = icon("Target", flagAltSvg);
export const ChartPie = icon("ChartPie", chartPieSvg);
export const TrendingUp = icon("TrendingUp", graphSvg);
export const History = icon("History", historySvg);
export const Coins = icon("Coins", moneySvg);
export const Lightbulb = icon("Lightbulb", lightbulbSvg);

// Orang & berbagi
export const Users = icon("Users", peopleSvg);
export const UserRound = icon("UserRound", userSvg);
export const UserPlus = icon("UserPlus", userPlusSvg);
export const UserMinus = icon("UserMinus", userUnfollowSvg);
export const UserX = icon("UserX", userXSvg);
export const Share2 = icon("Share2", shareAllSvg);
export const Crown = icon("Crown", starSvg);
export const KeyRound = icon("KeyRound", tagSvg);
export const LogOut = icon("LogOut", accountLogoutSvg);

// Aksi
export const Plus = icon("Plus", plusSvg);
export const PencilLine = icon("PencilLine", pencilSvg);
export const Trash2 = icon("Trash2", trashSvg);
export const Copy = icon("Copy", copySvg);
export const SearchIcon = icon("SearchIcon", magnifyingGlassSvg);
export const RotateCcw = icon("RotateCcw", reloadSvg);
export const MoreHorizontal = icon("MoreHorizontal", optionsSvg);
export const MoreHorizontalIcon = MoreHorizontal;
export const ExternalLink = icon("ExternalLink", externalLinkSvg);
export const Bell = icon("Bell", bellSvg);
export const Mail = icon("Mail", envelopeClosedSvg);
export const Lock = icon("Lock", lockLockedSvg);
export const ShieldCheck = icon("ShieldCheck", shieldAltSvg);
export const ShieldAlert = icon("ShieldAlert", warningSvg);
export const CalendarDays = icon("CalendarDays", calendarSvg);
export const CalendarClock = icon("CalendarClock", calendarCheckSvg);
export const Sparkles = icon("Sparkles", boltSvg);
export const PanelLeftIcon = icon("PanelLeftIcon", sidebarSvg);
export const GripVerticalIcon = icon("GripVerticalIcon", moveSvg);
