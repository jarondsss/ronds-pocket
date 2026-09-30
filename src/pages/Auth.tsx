import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Check, Mail, ShieldCheck, UserX } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

const PERKS = [
  "Buku kas pertama dibuat otomatis",
  "Undang partner pakai kode unik",
  "Saldo & rekap per bulan langsung terlihat",
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
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
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
      setError(
        caught instanceof Error
          ? caught.message
          : "Gagal mengirim kode verifikasi. Coba lagi ya.",
      );
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
      setError("Kode verifikasi salah. Coba periksa lagi ya.");
      setOtp("");
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
      setError("Gagal masuk sebagai tamu. Pakai email saja ya.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none fixed -left-28 -top-28 size-80 rounded-full bg-primary/18 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-24 bottom-0 size-72 rounded-full bg-accent/30 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="hidden lg:block"
        >
          <Brand />
          <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight tracking-tight">
            Buku kas untuk
            <span className="text-primary"> kamu dan partner.</span>
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Satu tempat untuk mencatat pengeluaran dan pemasukan berdua, tanpa
            spreadsheet dan tanpa ribet.
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
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
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
                Masukkan emailmu. Kami kirim kode 6 digit untuk masuk — akun
                baru langsung dibuat kalau belum ada.
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
                  Lanjut sebagai tamu
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight lg:mt-0">
                Cek email kamu
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Kami kirim kode ke{" "}
                <span className="font-semibold text-foreground">
                  {step.email}
                </span>
                .
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
                  Verifikasi kode
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
            Data keuanganmu hanya bisa diakses kamu dan partner di buku kas.
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
