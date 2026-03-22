"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Loader, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import API from "@/lib/axios";
import GoogleOauthButton from "@/components/auth/GoogleOauthButton";
import { toast } from "@/hooks/use-toast";

const formSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(18, "Name must be less than 18 characters")
      .trim()
      .refine((val) => !val.includes(" "), {
        message: "Organization name cannot contain spaces",
      }),
    email: z.string().email("Invalid email").trim(),
    password: z.string().min(6, "Password must be at least 6 characters").trim(),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters").trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Clean white-theme input base
const inputBase =
  "py-[12px] w-full px-4 bg-white rounded-[8px] text-[14px] font-normal leading-[150%] text-[#171717] placeholder-[#A3A3A3] border transition-all focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black";

type FormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { handleSubmit, register, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await API.post("/auth/register", data);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Registered successfully!",
        variant: "success",
      });
      router.push("/");
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || "Something went wrong!";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (isPending) return;
    mutate(data);
  };

  return (
    <div className="flex flex-col justify-center items-center gap-6 min-h-svh px-4 py-12 bg-[#FAFAFA]">
      <div className="flex w-full flex-col gap-8 justify-center items-center">
        {/* LOGO */}
        <Link href="/" className="flex item-center self-center">
          <Image src="/Logo.png" alt="logo" height={40} width={104} className="h-[40px] w-auto grayscale" />
        </Link>

        <div className="flex flex-col justify-center items-center p-8 gap-8 w-full bg-white border border-[#E5E5E5] rounded-[16px] shadow-sm max-w-[500px]">
          {/* HEADING */}
          <div className="flex flex-col justify-center items-center gap-1 text-center">
            <h3 className="font-bold text-[#171717] text-24 md:text-28">
              Create An Account
            </h3>
            <p className="text-14 md:text-16 text-[#737373] font-medium">
              Register with your Email or Google account
            </p>
          </div>

          <GoogleOauthButton label="Sign In" />

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center w-full">
            <div className="absolute inset-x-0 h-px bg-[#E5E5E5]"></div>
            <span className="relative z-10 px-3 bg-white text-sm font-medium text-[#A3A3A3]">
              Or Continue with
            </span>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full">
            
            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className={`font-semibold text-[14px] ${errors.name ? "text-red-500" : "text-[#404040]"}`}>
                Name
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                placeholder="Your name or Organization"
                className={`${inputBase} ${errors.name ? "border-red-500" : "border-[#D4D4D4]"}`}
              />
              {errors.name && <p className="text-red-500 text-[12px]">{errors.name.message}</p>}
            </div>

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
                className={`${inputBase} ${errors.email ? "border-red-500" : "border-[#D4D4D4]"}`}
              />
              {errors.email && <p className="text-red-500 text-[12px]">{errors.email.message}</p>}
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
                  placeholder="Create a password"
                  className={`${inputBase} ${errors.password ? "border-red-500" : "border-[#D4D4D4]"} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-black"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[12px]">{errors.password.message}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-2 relative">
              <label htmlFor="confirmPassword" className={`font-semibold text-[14px] ${errors.confirmPassword ? "text-red-500" : "text-[#404040]"}`}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Repeat your password"
                  className={`${inputBase} ${errors.confirmPassword ? "border-red-500" : "border-[#D4D4D4]"} pr-12`}
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-[12px]">{errors.confirmPassword.message}</p>}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isPending}
              className="mt-2 flex justify-center items-center py-3 w-full bg-[#171717] rounded-[8px] font-semibold text-[16px] text-white hover:bg-[#262626] disabled:bg-[#D4D4D4] transition-all shadow-md"
            >
              {isPending && <Loader className="animate-spin mr-2" size={18} />}
              {isPending ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="text-center text-sm text-[#737373]">
            Already have an account?{" "}
            <Link href="/login" className="underline font-bold text-[#171717] hover:text-black">
              Login
            </Link>
          </div>
        </div>
      </div>
      
      <div className="text-12 text-center text-[#A3A3A3] max-w-[320px]">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
      </div>
    </div>
  );
}