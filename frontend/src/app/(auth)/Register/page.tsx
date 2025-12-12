"use client";
import { RegisterForm } from "@/design-system/organisms/Auth";
import AuthPageTemplate from "@/design-system/templates/AuthPageTemplate";
export default function SignupPage() {
  return (
    <AuthPageTemplate
      title="ثبت‌نام در سایت"
      bottomText="چنانچه قبلا اکانت داشتی"
      bottomLinkText="ورود"
      bottomLinkHref="/Login"
    >
      <RegisterForm />
    </AuthPageTemplate>
  );
}
