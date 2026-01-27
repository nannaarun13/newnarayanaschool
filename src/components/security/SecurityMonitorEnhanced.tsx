import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  Activity,
  Eye,
  Globe,
} from "lucide-react";
import {
  getRecentLoginActivities,
  LoginActivity,
} from "@/utils/loginActivityUtils";
import { getSecurityClientInfo } from "@/utils/securityClientInfo";
import { useToast } from "@/hooks/use-toast";

const SecurityMonitorEnhanced = () => {
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<string[]>([]);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
    loadClientSecurity();
  }, []);

  /* -------------------- DATA LOADERS -------------------- */

  const loadSecurityData = async () => {
    try {
      const activities = await getRecentLoginActivities(50);
      setLoginActivities(activities);
      analyzeSecurityPatterns(activities);
    } catch (err) {
      console.error("Security data error:", err);
      toast({
        title: "Security Error",
        description: "Unable to load login activity data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientSecurity = async () => {
    try {
      const info = await getSecurityClientInfo(); // ✅ FIX
      setClientInfo(info);

      const alerts: string[] = [];

      if (!info.fingerprint.cookieEnabled) {
        alerts.push("Cookies are disabled");
      }

      if (info.fingerprint.doNotTrack === "1") {
        alerts.push("Do Not Track enabled");
      }

      const ua = info.fingerprint.userAgent.toLowerCase();
      if (ua.includes("bot") || ua.includes("crawler")) {
        alerts.push("Automated client detected");
      }

      setSecurityAlerts((prev) => [...new Set([...prev, ...alerts])]);
    } catch (err) {
      console.error("Client security error:", err);
    }
  };

  /* -------------------- ANALYSIS -------------------- */

  const analyzeSecurityPatterns = (activities: LoginActivity[]) => {
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();

    const recentFailures = activities.filter(
      (a) =>
        a.status === "failed" &&
        now - new Date(a.loginTime).getTime() < oneHour
    );

    const alerts: string[] = [];

    if (recentFailures.length > 10) {
      alerts.push("High number of failed logins in last hour");
    }

    const uniqueEmails = new Set(recentFailures.map((a) => a.email));
    if (uniqueEmails.size > 5 && recentFailures.length > 15) {
      alerts.push("Possible brute-force attack detected");
    }

    setSecurityAlerts((prev) => [...new Set([...prev, ...alerts])]);
  };

  /* -------------------- HELPERS -------------------- */

  const getStatusBadge = (status: string) =>
    status === "success" ? (
      <Badge className="bg-green-500">Success</Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    );

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  /* -------------------- METRICS -------------------- */

  const successCount = loginActivities.filter(
    (a) => a.status === "success"
  ).length;

  const failureCount = loginActivities.filter(
    (a) => a.status === "failed"
  ).length;

  const uniqueIPs = new Set(loginActivities.map((a) => a.ipAddress)).size;

  /* -------------------- RENDER -------------------- */

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Loading security data…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {securityAlerts.map((alert, i) => (
        <Alert key={i} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{alert}</AlertDescription>
        </Alert>
      ))}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric title="Successful Logins" value={successCount} icon={<Activity />} color="text-green-600" />
        <Metric title="Failed Attempts" value={failureCount} icon={<AlertTriangle />} color="text-red-600" />
        <Metric title="Unique IPs" value={uniqueIPs} icon={<Globe />} color="text-blue-600" />
        <Metric title="Total Events" value={loginActivities.length} icon={<Eye />} color="text-purple-600" />
      </div>

      {/* Client Info */}
      {clientInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Current Session
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid md:grid-cols-2 gap-4">
            <div>
              <p><b>Platform:</b> {clientInfo.fingerprint.platform}</p>
              <p><b>Language:</b> {clientInfo.fingerprint.language}</p>
              <p><b>Timezone:</b> {clientInfo.fingerprint.timezone}</p>
            </div>
            <div>
              <p><b>Screen:</b> {clientInfo.fingerprint.screen}</p>
              <p><b>Cookies:</b> {clientInfo.fingerprint.cookieEnabled ? "Enabled" : "Disabled"}</p>
              <p><b>Session:</b> {clientInfo.sessionId}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Login Activity</CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto space-y-3">
          {loginActivities.slice(0, 20).map((a, i) => (
            <div key={i} className="border p-3 rounded">
              <div className="flex items-center gap-2">
                <span className="font-medium">{a.email}</span>
                {getStatusBadge(a.status)}
              </div>
              <div className="text-sm text-gray-500">
                <p>{formatDateTime(a.loginTime)}</p>
                {a.ipAddress && <p>IP: {a.ipAddress}</p>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------- SMALL METRIC CARD -------------------- */
const Metric = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) => (
  <Card>
    <CardContent className="p-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={color}>{icon}</div>
    </CardContent>
  </Card>
);

export default SecurityMonitorEnhanced;
