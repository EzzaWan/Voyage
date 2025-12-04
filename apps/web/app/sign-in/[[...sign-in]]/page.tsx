import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <SignIn
        appearance={{
          baseTheme: "dark",
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
            rootBox: "mx-auto",
            card: "bg-[var(--voyage-card)] border border-[var(--voyage-border)] shadow-xl",
            headerTitle: "text-[var(--voyage-text)]",
            headerSubtitle: "text-[var(--voyage-muted)]",
            socialButtonsBlockButton: "bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] text-[var(--voyage-text)] hover:bg-[var(--voyage-card-hover)]",
            socialButtonsBlockButtonText: "text-[var(--voyage-text)]",
            formButtonPrimary: "bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white",
            formFieldInput: "bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-[var(--voyage-text)] focus:border-[var(--voyage-accent)]",
            formFieldLabel: "text-[var(--voyage-text)]",
            dividerLine: "bg-[var(--voyage-border)]",
            dividerText: "text-[var(--voyage-muted)]",
            footerActionLink: "text-[var(--voyage-accent)] hover:text-[var(--voyage-accent-soft)]",
            identityPreviewText: "text-[var(--voyage-text)]",
            identityPreviewEditButton: "text-[var(--voyage-accent)]",
            formResendCodeLink: "text-[var(--voyage-accent)]",
          },
        }}
      />
    </div>
  );
}

