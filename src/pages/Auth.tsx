import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { friendlyError } from "@/lib/error-message";
import { ArrowRight, Check, Lock, Mail, ShieldCheck, UserX } from "@/components/icons";
import { motion } from "framer-motion";

/** Satu kurva gerak untuk seluruh halaman: turun cepat, mendarat pelan. */
const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

const PERKS = [
  "Kantong pertamamu langsung disiapkan",
  "Catat pengeluaran dalam tiga detik",
  "Rekap bulanan tersusun otomatis",
];

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<
    "signIn" | { email: string } | "password"
  >("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (caught) {
      console.error("Email sign-in error:", caught);
      setError(friendlyError(caught, "Kodenya gagal dikirim. Coba sekali lagi ya."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (caught) {
      console.error("OTP verification error:", caught);
      setError(friendlyError(caught, "Kodenya belum cocok. Coba periksa lagi ya."));
      setOtp("");
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("password", formData);
      navigate(redirect);
    } catch (caught) {
      console.error("Password sign-in error:", caught);
      setError(friendlyError(caught, "Email atau kata sandi belum cocok. Coba lagi ya."));
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (caught) {
      console.error("Guest login error:", caught);
      setError(friendlyError(caught, "Masuk sebagai tamu gagal. Pakai email saja ya."));
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none fixed -left-28 -top-28 size-80 rounded-full bg-primary/18 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="hidden lg:block"
        >
          <Brand />
          <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight tracking-tight">
            Kantong kecil
            <span className="text-primary"> buat uangmu.</span>
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Satu tempat untuk menampung semua catatan uangmu, dari uang jajan
            sampai gajian. Tanpa spreadsheet, tanpa pusing.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="clay-sm flex items-center gap-3 px-4 py-3 text-sm font-semibold"
              >
                <Check className="size-4 shrink-0 text-income" />
                {perk}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
          className="clay mx-auto w-full max-w-md p-6 sm:p-8"
        >
          <div className="flex justify-center lg:hidden">
            <Brand />
          </div>

          {step === "signIn" ? (
            <>
              <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight lg:mt-0">
                Masuk atau daftar
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Masukkan emailmu. Kalau belum punya akun, kami buatkan
                sekalian: daftar dan masuk lewat pintu yang sama.
              </p>

              <form onSubmit={handleEmailSubmit} className="mt-6">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@email.com"
                      className="pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    className="size-9"
                    disabled={isLoading}
                    aria-label="Kirim kode"
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>

                {error && (
                  <p className="mt-3 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    atau
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                >
                  <UserX className="size-4" />
                  Coba dulu sebagai tamu
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("password");
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="mt-4 w-full text-center text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Sudah punya kata sandi? Masuk pakai email dan kata sandi
                </button>
              </form>
            </>
          ) : step === "password" ? (
            <>
              <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight lg:mt-0">
                Masuk pakai kata sandi
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Isi email dan kata sandi yang sudah kamu buat di halaman
                profil.
              </p>

              <form onSubmit={handlePasswordSubmit} className="mt-6">
                <input type="hidden" name="flow" value="signIn" />
                <Label htmlFor="pw-email" className="text-xs font-bold">
                  Email
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pw-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    className="pl-9"
                    disabled={isLoading}
                    required
                  />
                </div>
                <Label htmlFor="pw-password" className="mt-4 block text-xs font-bold">
                  Kata sandi
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pw-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Kata sandi kamu"
                    className="pl-9"
                    disabled={isLoading}
                    required
                  />
                </div>

                {error && (
                  <p className="mt-3 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <Button type="submit" className="mt-6 w-full" disabled={isLoading}>
                  Masuk ke kantongku
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => {
                    setStep("signIn");
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  Kembali ke masuk dengan kode
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight lg:mt-0">
                Cek emailmu
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Kami kirim kode enam digit ke{" "}
                <span className="font-semibold text-foreground">
                  {step.email}
                </span>
                . Masukkan di bawah ya.
              </p>

              <form onSubmit={handleOtpSubmit} className="mt-6">
                <input type="hidden" name="email" value={step.email} />
                <input type="hidden" name="code" value={otp} />

                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        otp.length === 6 &&
                        !isLoading
                      ) {
                        const form = (event.target as HTMLElement).closest(
                          "form",
                        );
                        form?.requestSubmit();
                      }
                    }}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <p className="mt-3 text-center text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="mt-6 w-full"
                  disabled={isLoading || otp.length !== 6}
                >
                  Masuk ke kantongku
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => {
                    setStep("signIn");
                    setOtp("");
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  Ganti email
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2.5 text-[11px] font-semibold text-muted-foreground">
            <ShieldCheck className="size-3.5 text-income" />
            Cuma kamu yang bisa membuka kantongmu.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
