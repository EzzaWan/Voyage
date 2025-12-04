import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--voyage-accent)]/10 rounded-full blur-[100px] -z-10" />
      
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#3B82F6", // Lighter blue
            colorBackground: "#112240", // Slightly lighter dark background
            colorInputBackground: "#FFFFFF", // White input background
            colorInputText: "#0F172A", // Dark text for inputs
            colorText: "#E9F1FF",
            colorTextSecondary: "#94A3B8",
            borderRadius: "0.75rem",
            fontFamily: "inherit",
          },
          elements: {
            rootBox: "mx-auto w-full max-w-md",
            // Lighter modal background
            card: "bg-[#162C4E] border border-[var(--voyage-border)] shadow-2xl ring-1 ring-white/10",
            headerTitle: "text-2xl font-bold text-white",
            headerSubtitle: "text-gray-300 text-base",
            socialButtonsBlockButton: "bg-[#1E3A5F] border border-white/10 text-white hover:bg-[#2A4D7A] transition-all duration-200",
            socialButtonsBlockButtonText: "text-white font-medium",
            // Light gradient button
            formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 font-semibold",
            // White inputs with dark text
            formFieldInput: "bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200",
            formFieldLabel: "text-gray-300 font-medium",
            dividerLine: "bg-white/10",
            dividerText: "text-gray-400 uppercase text-xs tracking-wider",
            footerActionLink: "text-cyan-400 hover:text-cyan-300 font-medium underline-offset-4 hover:underline",
            identityPreviewText: "text-gray-300",
            identityPreviewEditButton: "text-cyan-400 hover:text-cyan-300",
            formResendCodeLink: "text-cyan-400 hover:text-cyan-300",
            alert: "bg-red-500/10 border border-red-500/20 text-red-200",
            alertText: "text-red-200",
          },
        }}
      />
    </div>
  );
}
