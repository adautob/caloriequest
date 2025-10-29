
import Header from "@/components/Header";
import ProfileForm from "@/components/profile/ProfileForm";
import ProtectedPage from "@/components/auth/ProtectedPage";
import GoalProjection from "@/components/profile/GoalProjection";

export default function ProfilePage() {
    return (
        <ProtectedPage>
            <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
                    <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
                        <div className="grid gap-6">
                            <ProfileForm />
                            <GoalProjection />
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedPage>
    );
}
