import { useState, useEffect } from "react";
import { Monitor } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const [rememberMe, setRememberMe] = useState(
    !!localStorage.getItem("savedEmail")
  );

  const [username, setUsername] = useState(
    localStorage.getItem("savedEmail") || ""
  );
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        window.location.href = "/dashboard";
      }
    };
  
    checkSession();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });
  
    if (error) {
      alert(error.message);
      return;
    }

    if (rememberMe) {
      localStorage.setItem("savedEmail", username);
    } else {
      localStorage.removeItem("savedEmail");
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-card">
            <Monitor className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Server Monitor</h1>
          <p className="text-sm text-muted-foreground">Real-time Infrastructure Monitoring</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-sm">
          <CardContent className="space-y-5 p-8">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Username or Email
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Password
                </label>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label htmlFor="remember" className="text-sm text-foreground">
                  Remember me
                </label>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--status-online))]" />
                <span className="text-xs font-semibold uppercase text-primary">System Online</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full text-sm font-bold uppercase tracking-wider"
                size="lg"
                onClick={handleLogin}
              >
                Sign in to Dashboard
              </Button>

            </div>

          </CardContent>
        </Card>

        {/* Status Footer */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 rounded-full border border-border bg-card px-5 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--status-online))]" />
              Elasticsearch: Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--status-online))]" />
              Zabbix API: Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Server Monitor. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
