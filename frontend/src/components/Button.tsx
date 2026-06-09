interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-red-600 hover:bg-red-700 text-white",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-white",
    ghost: "hover:bg-zinc-800 text-white",
  };

  return (
    <button
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
