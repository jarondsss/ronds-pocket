import { AppPageHeader } from "@/components/dashboard/AppPageHeader";
import {
  ChartPie,
  History,
  Landmark,
  PiggyBank,
  Target,
  Users,
  HandCoins,
} from "@/components/icons";
import { NavLink } from "react-router";

const features = [
  {
    to: "/dashboard/anggaran",
    title: "Anggaran",
    description: "Jatah belanja per kategori",
    icon: HandCoins,
  },
  {
    to: "/dashboard/goals",
    title: "Tujuan",
    description: "Kejar target yang kamu rencanakan",
    icon: Target,
  },
  {
    to: "/dashboard/tabungan",
    title: "Tabungan",
    description: "Catat aset yang kamu simpan",
    icon: PiggyBank,
  },
  {
    to: "/dashboard/rekap",
    title: "Rekap",
    description: "Lihat pola arus uang",
    icon: ChartPie,
  },
  {
    to: "/dashboard/net-worth",
    title: "Kekayaan bersih",
    description: "Aset dikurangi kewajiban",
    icon: Landmark,
  },
  {
    to: "/dashboard/partner",
    title: "Partner",
    description: "Kelola kantong bersama",
    icon: Users,
  },
  {
    to: "/dashboard/riwayat/aktivitas",
    title: "Riwayat perubahan",
    description: "Jejak aktivitas anggota",
    icon: History,
  },
];

export default function Features() {
  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader
        title="Fitur kantong"
        subtitle="Pilih yang ingin kamu atur."
      />
      <nav
        aria-label="Semua fitur kantong"
        className="overflow-hidden rounded-[1.5rem] bg-card px-5 shadow-[0_14px_30px_-24px_var(--clay-dark)]"
      >
        {features.map(({ to, title, description, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex min-h-16 items-center gap-4 border-b border-border/70 py-3 last:border-b-0 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Icon className="size-5 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-bold">{title}</span>
              <span className="block text-xs text-muted-foreground">
                {description}
              </span>
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
