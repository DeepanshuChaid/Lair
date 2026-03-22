"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Loader, Eye, EyeOff } from "lucide-react";
import API from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import GoogleOauthButton from "@/components/auth/GoogleOauthButton";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("Invalid email").trim().min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").trim(),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await API.post("/auth/login", data);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Login successful!", variant: "success" });
      router.push("/");
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || "Something went wrong!";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: process.env.NODE_ENV === "development" ? "cogito@gmail.com" : "",
      password: process.env.NODE_ENV === "development" ? "cogitoergosum" : "",
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isPending) return;
    mutate(data);
  };

  return (
    <div className="flex flex-col justify-center items-center gap-6 min-h-svh px-4 py-12 bg-[#FAFAFA]">
      <div className="flex w-full flex-col gap-8 justify-center items-center">
        <Link href="/" className="flex item-center self-center">
          <Image src="/Logo.png" alt="logo" height={40} width={104} className="h-[40px] w-auto grayscale" />
        </Link>

        <div className="flex flex-col justify-center items-center p-8 gap-8 w-full bg-white border border-[#E5E5E5] rounded-[16px] shadow-sm max-w-[500px]">
          {/* HEADING */}
          <div className="flex flex-col justify-center items-center gap-1">
            <h3 className="font-bold text-[#171717] text-24 md:text-28">
              Welcome back
            </h3>
            <p className="text-14 md:text-16 text-[#737373] font-medium">
              Login to your account to continue
            </p>
          </div>

          <GoogleOauthButton label="Sign Up" />

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center w-full">
            <div className="absolute inset-x-0 h-px bg-[#E5E5E5]"></div>
            <span className="relative z-10 px-3 bg-white text-sm font-medium text-[#A3A3A3]">
              Or Continue with
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className={`font-semibold text-[14px] ${errors.email ? "text-red-500" : "text-[#404040]"}`}>
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                placeholder="name@example.com"
                className={`py-3 w-full px-4 bg-white border ${errors.email ? "border-red-500" : "border-[#D4D4D4]"} rounded-[8px] text-[14px] text-[#171717] placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all`}
              />
              {errors.email && <p className="text-red-500 text-[12px] mt-1">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2 relative">
              <label htmlFor="password" className={`font-semibold text-[14px] ${errors.password ? "text-red-500" : "text-[#404040]"}`}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter your password"
                  className={`py-3 w-full px-4 pr-12 bg-white border ${errors.password ? "border-red-500" : "border-[#D4D4D4]"} rounded-[8px] text-[14px] text-[#171717] placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-black"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[12px] mt-1">{errors.password.message}</p>}
              
              <a href="/forgot-password" className="text-[#171717] font-medium text-[13px] mt-1 self-end hover:underline">
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isPending}
              className="flex justify-center items-center py-3 w-full bg-[#171717] rounded-[8px] font-semibold text-[16px] text-white hover:bg-[#262626] disabled:bg-[#D4D4D4] transition-all shadow-md"
            >
              {isPending && <Loader className="animate-spin mr-2" size={18} />}
              {isPending ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="text-center text-sm text-[#737373]">
            Don't have an account?{" "}
            <Link href="/register" className="underline font-bold text-[#171717] hover:text-black">
              Register
            </Link>
          </div>
        </div>
      </div>
      
      <div className="text-12 text-center text-[#A3A3A3] max-w-[300px]">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
      </div>
    </div>
  );
}