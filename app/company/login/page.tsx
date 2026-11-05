"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Lock, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { authClient, clearAccessToken } from "@/lib/auth-client";

const L = {
  en: { email: "Please enter a valid email address", pw: "Password must be at least 8 characters", name: "Company name must be at least 2 characters", match: "Passwords don't match",
        newTitle: "Create your company account", newLead: "Start with the free, private self-assessment.", signIn: "Sign In", create: "Create Account", creating: "Creating account...", company: "Company name", emailL: "Email", password: "Password", confirm: "Confirm password",
        code: "6-digit code from your authenticator app", backup: "Backup code", useBackup: "Lost your phone? Use a backup code", useApp: "Use the authenticator app instead", verify: "Verify",
        badCode: "That code didn't work. Try the current code from your authenticator app.", placeholder: "Example Battery Materials Co." },
  zh: { email: "请输入有效的电子邮箱", pw: "密码至少需要 8 个字符", name: "企业名称至少需要 2 个字符", match: "两次输入的密码不一致",
        newTitle: "创建企业账户", newLead: "从免费、保密的自我评估开始。", signIn: "登录", create: "创建账户", creating: "正在创建账户...", company: "企业名称", emailL: "电子邮箱", password: "密码", confirm: "确认密码",
        code: "身份验证器应用中的 6 位验证码", backup: "备用验证码", useBackup: "手机丢失？使用备用验证码", useApp: "改用身份验证器应用", verify: "验证",
        badCode: "验证码无效，请输入身份验证器应用中当前显示的验证码。", placeholder: "示例电池材料有限公司" },
};

const schemas = (l: (typeof L)["en"]) => ({
  login: z.object({ email: z.string().email(l.email), password: z.string().min(1, l.pw) }),
  signup: z.object({
    companyName: z.string().min(2, l.name), email: z.string().email(l.email), password: z.string().min(8, l.pw), confirmPassword: z.string(),
  }).refine((d) => d.password === d.confirmPassword, { message: l.match, path: ["confirmPassword"] }),
});

type LoginForm = { email: string; password: string };
type SignupForm = { companyName: string; email: string; password: string; confirmPassword: string };

/** Only same-site paths, so a crafted link can't send people elsewhere after sign-in. */
const safeNext = () => {
  const n = new URLSearchParams(window.location.search).get("next") ?? "";
  return n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : null;
};

export default function CompanyLoginPage() {
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();
  const { t, language } = useLanguage();
  const l = L[language] ?? L.en;
  const sc = schemas(l);
  const [codeStep, setCodeStep] = useState(false);
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("login");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "signup") setTab("signup");
  }, []);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(sc.login),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(sc.signup),
    defaultValues: { companyName: "", email: "", password: "", confirmPassword: "" },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(safeNext() ?? "/company/profile");
    }
  }, [user, router]);

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const { twoFactor } = await signIn(data.email, data.password);
      if (twoFactor) { setCodeStep(true); return; }
      router.push(safeNext() ?? "/company/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error: err } = useBackup
      ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
      : await authClient.twoFactor.verifyTotp({ code: code.replace(/\s/g, "") });
    setIsLoading(false);
    if (err) { setError(l.badCode); return; }
    clearAccessToken();
    window.location.assign(safeNext() ?? "/company/profile");
  };

  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);
    try {
      await signUp(data.email, data.password);

      // signUp sets the session — create customer immediately
      const customer = await api.customers.create({
        name: data.companyName,
      });

      router.push(safeNext() ?? `/customers/${customer.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {tab === "signup" ? l.newTitle : t("loginWelcome")}
            </h1>
            <p className="text-muted-foreground">{tab === "signup" ? l.newLead : t("loginSubtitle")}</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {codeStep ? (
                <form onSubmit={handleCode} className="space-y-3">
                  <label className="block text-sm font-medium" htmlFor="code">{useBackup ? l.backup : l.code}</label>
                  <Input id="code" autoFocus inputMode={useBackup ? "text" : "numeric"} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
                  <button type="button" className="text-xs text-muted-foreground underline" onClick={() => { setUseBackup(!useBackup); setCode(""); }}>{useBackup ? l.useApp : l.useBackup}</button>
                  <Button type="submit" className="w-full" disabled={isLoading || !code.trim()}>{l.verify}</Button>
                </form>
              ) : (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="login" className="flex-1">{l.signIn}</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1">{l.create}</TabsTrigger>
                </TabsList>

                {/* Login tab */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("loginEmail")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input type="email" placeholder="you@company.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("loginPassword")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <PasswordInput placeholder="••••••••" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? t("loginSigningIn") : t("loginSubmit")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => router.push("/company/forgot-password")}
                          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                {/* Sign up tab */}
                <TabsContent value="signup">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                      <FormField
                        control={signupForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{l.company}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder={l.placeholder} className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{l.emailL}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input type="email" placeholder="you@company.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{l.password}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <PasswordInput placeholder="••••••••" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{l.confirm}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <PasswordInput placeholder="••••••••" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? l.creating : l.create}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        {language === "zh" ? <>创建账户即表示您同意<Link href="/terms" className="underline">服务条款</Link>和<Link href="/privacy" className="underline">隐私政策</Link>。</>
                          : <>By creating an account you agree to the <Link href="/terms" className="underline">Terms of service</Link> and <Link href="/privacy" className="underline">Privacy policy</Link>.</>}
                      </p>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="ghost" onClick={() => router.push("/")}>
              {t("loginBackHome")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
