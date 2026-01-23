
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Clock, Eye, Globe } from 'lucide-react';
import { getRecentLoginActivities, LoginActivity } from '@/utils/loginActivityUtils';
import { getSecurityClientInfo, detectAnomalies } from '@/utils/securityClientInfo';
import { useToast } from '@/hooks/use-toast';

const SecurityMonitorEnhanced = () => {
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
    checkClientSecurity();
  }, []);

  const loadSecurityData = async () => {
    try {
      const activities = await getRecentLoginActivities(50);
      setLoginActivities(activities);
      
      // Analyze for security patterns
      analyzeSecurityPatterns(activities);
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast({
        title: "Security Data Error",
        description: "Could not load security monitoring data.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const checkClientSecurity = () => {
    const info = getSecurityClientInfo();
    setClientInfo(info);
    
    // Check for basic security indicators
    const alerts: string[] = [];
    
    if (!info.fingerprint.cookieEnabled) {
      alerts.push('Cookies disabled - may affect security features');
    }
    
    if (info.fingerprint.doNotTrack === '1') {
      alerts.push('Do Not Track enabled');
    }
    
    // Check for suspicious user agent patterns
    const userAgent = info.fingerprint.userAgent.toLowerCase();
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
      alerts.push('Automated client detected');
    }
    
    setSecurityAlerts(alerts);
  };

  const analyzeSecurityPatterns = (activities: LoginActivity[]) => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentFailures = activities.filter(a => 
      a.status === 'failed' && 
      (now - new Date(a.loginTime).getTime()) < oneHour
    );
    
    if (recentFailures.length > 10) {
      setSecurityAlerts(prev => [...prev, 'High number of recent failed login attempts']);
    }
    
    // Check for suspicious patterns
    const uniqueEmails = new Set(recentFailures.map(a => a.email));
    if (uniqueEmails.size > 5 && recentFailures.length > 15) {
      setSecurityAlerts(prev => [...prev, 'Potential brute force attack detected']);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'success' ? (
      <Badge variant="default" className="bg-green-500">Success</Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    );
  };

  const formatDateTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const recentFailures = loginActivities.filter(a => a.status === 'failed').length;
  const recentSuccesses = loginActivities.filter(a => a.status === 'success').length;
  const uniqueIPs = new Set(loginActivities.map(a => a.ipAddress)).size;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Enhanced Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading security data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="space-y-2">
          {securityAlerts.map((alert, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful Logins</p>
                <p className="text-2xl font-bold text-green-600">{recentSuccesses}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed Attempts</p>
                <p className="text-2xl font-bold text-red-600">{recentFailures}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique IPs</p>
                <p className="text-2xl font-bold text-blue-600">{uniqueIPs}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-purple-600">{loginActivities.length}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Security Info */}
      {clientInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Current Session Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Platform:</strong> {clientInfo.fingerprint.platform}</p>
                <p><strong>Language:</strong> {clientInfo.fingerprint.language}</p>
                <p><strong>Timezone:</strong> {clientInfo.fingerprint.timezone}</p>
              </div>
              <div>
                <p><strong>Screen:</strong> {clientInfo.fingerprint.screen}</p>
                <p><strong>Cookies:</strong> {clientInfo.fingerprint.cookieEnabled ? 'Enabled' : 'Disabled'}</p>
                <p><strong>Session ID:</strong> {clientInfo.sessionId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Login Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loginActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No login activities found.</p>
            ) : (
              loginActivities.slice(0, 20).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{activity.email}</span>
                      {getStatusBadge(activity.status)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <p>Time: {formatDateTime(activity.loginTime)}</p>
                      {activity.failureReason && (
                        <p className="text-red-600">Reason: {activity.failureReason}</p>
                      )}
                      {activity.ipAddress && (
                        <p>IP: {activity.ipAddress}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityMonitorEnhanced;
