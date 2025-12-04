import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--voyage-accent)]/10 rounded-full blur-[100px] -z-10" />
      
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#1E90FF",
            colorBackground: "#0A1A2F",
            colorInputBackground: "#132742",
            colorInputText: "#E9F1FF",
            colorText: "#E9F1FF",
            colorTextSecondary: "#A8B5C8",
            borderRadius: "0.75rem",
            fontFamily: "inherit",
          },
          elements: {
            rootBox: "mx-auto w-full max-w-md",
            card: "bg-[var(--voyage-card)]/80 backdrop-blur-xl border border-[var(--voyage-border)] shadow-2xl ring-1 ring-white/5",
            headerTitle: "text-2xl font-bold text-[var(--voyage-text)]",
            headerSubtitle: "text-[var(--voyage-muted)] text-base",
            socialButtonsBlockButton: "bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] text-[var(--voyage-text)] hover:bg-[var(--voyage-accent)]/10 hover:border-[var(--voyage-accent)] transition-all duration-200",
            socialButtonsBlockButtonText: "text-[var(--voyage-text)] font-medium",
            formButtonPrimary: "bg-gradient-to-r from-[var(--voyage-accent)] to-[#0070F3] hover:brightness-110 text-white shadow-lg shadow-blue-500/20 transition-all duration-200",
            formFieldInput: "bg-[var(--voyage-bg)] border border-[var(--voyage-border)] text-[var(--voyage-text)] placeholder:text-gray-500 focus:border-[var(--voyage-accent)] focus:ring-2 focus:ring-[var(--voyage-accent)]/20 transition-all duration-200",
            formFieldLabel: "text-[var(--voyage-text)] font-medium",
            dividerLine: "bg-[var(--voyage-border)]",
            dividerText: "text-[var(--voyage-muted)] uppercase text-xs tracking-wider",
            footerActionLink: "text-[var(--voyage-accent)] hover:text-[var(--voyage-accent-soft)] font-medium underline-offset-4 hover:underline",
            identityPreviewText: "text-[var(--voyage-text)]",
            identityPreviewEditButton: "text-[var(--voyage-accent)]",
            formResendCodeLink: "text-[var(--voyage-accent)]",
            alert: "bg-red-500/10 border border-red-500/20 text-red-200",
            alertText: "text-red-200",
          },
        }}
      />
    </div>
  );
}
