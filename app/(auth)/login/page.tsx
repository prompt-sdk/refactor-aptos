"use client";
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { WalletSelector } from '@/components/context/wallet-selector';
import { AuthForm } from "@/components/custom/auth-form";
import { SubmitButton } from "@/components/custom/submit-button";
import LoginBg from '@/public/assets/images/modal-login-frame.png';

import { login, LoginActionState } from "../actions";
export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    },
  );

  useEffect(() => {
    if (state.status === "failed") {
      toast.error("Invalid credentials!");
    } else if (state.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="flex grow items-center justify-center">
      <div className="container flex flex-col items-center justify-center">
        <Image
          src={LoginBg.src}
          alt="Modal Login Frame"
          width={458}
          height={658}
          className="absolute left-0 top-0 z-0 size-full"
        />
        <div className="relative h-[400px] w-full max-w-[400px]">
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton>Sign in</SubmitButton>
            <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
              {"Don't have an account? "}
              <Link
                href="/register"
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Sign up
              </Link>
              {" for free."}
            </p>
          </AuthForm>
          <WalletSelector />
        </div>
      </div>
    </div>
  );
}
