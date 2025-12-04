import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[var(--voyage-card)] border-[var(--voyage-border)]",
          },
        }}
      />
    </div>
  );
}

