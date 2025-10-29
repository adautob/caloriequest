
import Header from "@/components/Header";
import ProfileForm from "@/components/profile/ProfileForm";
import ProtectedPage from "@/components/auth/ProtectedPage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProfilePage() {
    return (
        <ProtectedPage>
            <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
                    <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
                        <Button asChild variant="outline" className="w-fit">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar ao Painel
                            </Link>
                        </Button>
                        <div className="grid gap-6">
                            <ProfileForm />
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedPage>
    );
}
