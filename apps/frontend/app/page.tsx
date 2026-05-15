"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            router.push("/dashboard");
        } else {
            router.push("/auth/login");
        }
    }, [router]);

    return <div className="flex items-center justify-center h-screen">Loading...</div>;
}
