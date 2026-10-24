import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Lock } from "@/components/icons";
import { friendlyError } from "@/lib/error-message";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}
type Step = "email" | "password" | { email: string };

function destinationOf(value: string | null, fallback = "/dashboard") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export default function Auth({ redirectAfterAuth }: AuthProps) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destination = destinationOf(params.get("returnTo"), redirectAfterAuth);
  const [step, setStep] = useState<Step>("email");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated)
      navigate(destination, { replace: true });
  }, [authLoading, isAuthenticated, destination, navigate]);

  const requestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const data = new FormData(event.currentTarget);
      await signIn("email-otp", data);
      setStep({ email: String(data.get("email") ?? "") });
    } catch (caught) {
      setError(friendlyError(caught, "Kode gagal dikirim. Coba lagi ya."));
    } finally {
      setSending(false);
    }
  };
  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await signIn("email-otp", new FormData(event.currentTarget));
      navigate(destination);
    } catch (caught) {
      setError(friendlyError(caught, "Kodenya belum cocok. Periksa lagi ya."));
      setOtp("");
      setSending(false);
    }
  };
  const loginPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await signIn("password", new FormData(event.currentTarget));
      navigate(destination);
    } catch (caught) {
      setError(friendlyError(caught, "Email atau kata sandi belum cocok."));
      setSending(false);
    }
  };
  const loginGuest = async () => {
    setSending(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(destination);
    } catch (caught) {
      setError(
        friendlyError(caught, "Masuk sebagai tamu gagal. Coba pakai email ya."),
      );
      setSending(false);
    }
  };

  const title =
    step === "email"
      ? "Masuk atau daftar"
      : step === "password"
        ? "Masuk dengan kata sandi"
        : "Cek emailmu";
  const subtitle =
    step === "email" ? (
      "Masukkan emailmu. Kalau belum punya akun, kita buatkan sekalian."
    ) : step === "password" ? (
      "Pakai email dan kata sandi yang kamu buat di Profil."
    ) : (
      <>
        Kode enam digit dikirim ke{" "}
        <strong className="text-foreground">{step.email}</strong>.
      </>
    );
  const switchStep = (next: Step) => {
    setStep(next);
    setError(null);
    setOtp("");
  };

  return (
    <div className="public-design min-h-dvh bg-background px-6 py-10 text-foreground sm:py-12">
      <div className="mx-auto w-full max-w-[390px]">
        <Link
          to="/"
          className="font-display text-2xl font-extrabold text-primary"
        >
          Ronds Pocket
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          Kantong kecil buat uangmu.
        </p>
        <main className="mt-8 rounded-[1.7rem] bg-card p-5 shadow-[0_16px_30px_-20px_var(--clay-dark)] sm:p-6">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent text-primary">
            <Lock className="size-5" />
          </span>
          <h1 className="mt-6 font-display text-[1.7rem] font-extrabold leading-tight">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>

          {step === "email" && (
            <form onSubmit={requestCode} className="mt-6 space-y-2">
              <Label htmlFor="auth-email" className="text-xs font-semibold">
                Email
              </Label>
              <Input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                required
                disabled={sending}
                className="h-12 rounded-2xl border-0 bg-secondary px-4 text-sm"
              />
              <Button
                type="submit"
                disabled={sending}
                className="mt-3 h-12 w-full rounded-2xl"
              >
                {sending ? "Mengirim kode..." : "Kirim kode masuk"}
              </Button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={loginPassword} className="mt-6 space-y-3">
              <input type="hidden" name="flow" value="signIn" />
              <div className="space-y-2">
                <Label
                  htmlFor="password-email"
                  className="text-xs font-semibold"
                >
                  Email
                </Label>
                <Input
                  id="password-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={sending}
                  className="h-12 rounded-2xl border-0 bg-secondary px-4"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password-value"
                  className="text-xs font-semibold"
                >
                  Kata sandi
                </Label>
                <Input
                  id="password-value"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={sending}
                  className="h-12 rounded-2xl border-0 bg-secondary px-4"
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="h-12 w-full rounded-2xl"
              >
                {sending ? "Membuka kantong..." : "Masuk ke kantongku"}
              </Button>
            </form>
          )}

          {typeof step === "object" && (
            <form onSubmit={verifyCode} className="mt-6 space-y-4">
              <input type="hidden" name="email" value={step.email} />
              <input type="hidden" name="code" value={otp} />
              <Label htmlFor="auth-code" className="text-xs font-semibold">
                Kode masuk
              </Label>
              <div id="auth-code" className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  disabled={sending}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                type="submit"
                disabled={sending || otp.length !== 6}
                className="h-12 w-full rounded-2xl"
              >
                {sending ? "Memeriksa kode..." : "Masuk ke kantongku"}
              </Button>
            </form>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-destructive"
            >
              {error}
            </p>
          )}
          {step === "email" ? (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                atau
                <span className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={() => void loginGuest()}
                disabled={sending}
                className="min-h-11 w-full rounded-xl text-sm font-bold text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
              >
                Coba sebagai tamu
              </button>
              <button
                type="button"
                onClick={() => switchStep("password")}
                className="mt-2 min-h-11 w-full text-left text-xs font-semibold text-primary"
              >
                Masuk dengan kata sandi
              </button>
              <p className="mt-4 text-xs text-muted-foreground">
                Email digunakan untuk masuk ke akunmu.
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => switchStep("email")}
              className="mt-5 min-h-11 text-xs font-semibold text-primary"
            >
              {step === "password" ? "Masuk dengan kode email" : "Ganti email"}
            </button>
          )}
        </main>
        <Link
          to="/"
          className="mt-7 inline-flex min-h-11 items-center text-xs font-semibold text-primary"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
