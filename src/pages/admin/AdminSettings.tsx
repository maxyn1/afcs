
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Settings, Bell, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const AdminSettings = () => {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [systemUpdates, setSystemUpdates] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  
  const handleSaveGeneral = () => {
    toast({
      title: "Settings saved",
      description: "Your general settings have been updated successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification preferences saved",
      description: "Your notification settings have been updated successfully.",
    });
  };

  const handleSaveSecurity = () => {
    toast({
      title: "Security settings saved",
      description: "Your security settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings size={16} />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell size={16} />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield size={16} />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your admin account preferences and system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email Address</Label>
                <Input id="admin-email" defaultValue={user?.email} readOnly />
                <p className="text-sm text-muted-foreground">
                  This is the email address associated with your admin account
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-name">Display Name</Label>
                <Input id="admin-name" defaultValue={user?.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-timezone">System Timezone</Label>
                <Label htmlFor="system-timezone">System Timezone</Label>
                <Label htmlFor="system-timezone">System Timezone</Label>
                <Label htmlFor="system-timezone">System Timezone</Label>
                <select 
                  id="system-timezone" 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  defaultValue="Africa/Nairobi"
                  aria-label="System Timezone"
                >
                  <option value="Africa/Nairobi">East Africa Time (EAT) - Nairobi</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                  <option value="Africa/Lagos">West Africa Time (WAT) - Lagos</option>
                  <option value="Africa/Cairo">Eastern European Time (EET) - Cairo</option>
                </select>
              </div>

              <Button onClick={handleSaveGeneral}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                  <span>Email Notifications</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive system notifications via email
                  </span>
                </Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="sms-notifications" className="flex flex-col space-y-1">
                  <span>SMS Notifications</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive urgent alerts via SMS
                  </span>
                </Label>
                <Switch
                  id="sms-notifications"
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="system-updates" className="flex flex-col space-y-1">
                  <span>System Updates</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Get notified about system updates and maintenance
                  </span>
                </Label>
                <Switch
                  id="system-updates"
                  checked={systemUpdates}
                  onCheckedChange={setSystemUpdates}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="transaction-alerts" className="flex flex-col space-y-1">
                  <span>Transaction Alerts</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive alerts for important transactions
                  </span>
                </Label>
                <Switch
                  id="transaction-alerts"
                  checked={transactionAlerts}
                  onCheckedChange={setTransactionAlerts}
                />
              </div>

              <Button onClick={handleSaveNotifications}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              
              <div className="flex items-center justify-between space-x-2 border-t pt-4">
                <Label htmlFor="two-factor" className="flex flex-col space-y-1">
                  <span>Two-Factor Authentication</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Enable 2FA for enhanced security
                  </span>
                </Label>
                <Switch id="two-factor" />
              </div>

              <Button onClick={handleSaveSecurity}>Update Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;