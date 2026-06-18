import { LoginForm } from "@/design-system/organisms/Auth";
import AuthPageTemplate from "@/design-system/templates/AuthPageTemplate";
export default function LoginPage() {4

  return (
    <AuthPageTemplate
      title="ورود به حساب کاربری"
      bottomText="چنانچه ثبت‌نام نکرده‌اید"
      bottomLinkText="ثبت‌نام کنید"
      bottomLinkHref="/Register"
    >
      <LoginForm />
    </AuthPageTemplate>
  );
}
