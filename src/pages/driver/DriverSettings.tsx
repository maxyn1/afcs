import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import driverService from "@/services/driverService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Bell, Check, Globe, Key, Languages, Lock, Shield, Volume2 } from "lucide-react";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  lastPasswordChange?: string;
}

interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newTrips: boolean;
  paymentUpdates: boolean;
  systemAnnouncements: boolean;
  maintenanceAlerts?: boolean;
}

interface Settings {
  language: string;
  theme: 'light' | 'dark' | 'system';
  autoStartTrips: boolean;
  showEarnings: boolean;
  voiceNavigation: boolean;
  notifications: NotificationPreferences;
  security: SecuritySettings;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const DriverSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"account" | "notifications" | "security">("account");
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["driverSettings"],
    queryFn: driverService.getSettings,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => driverService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverSettings"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) => 
      driverService.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverSettings"] });
      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      driverService.updatePassword(data),
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: () => {
      toast({
        title: "Password update failed",
        description: "Failed to update password. Please check your current password and try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleNotification = (key: keyof NotificationPreferences) => {
    if (!settings?.notifications) return;
    
    updateNotificationsMutation.mutate({
      ...settings.notifications,
      [key]: !settings.notifications[key],
    });
  };

  const handleUpdateLanguage = (language: Settings['language']) => {
    if (!settings) return;
    updateSettingsMutation.mutate({
      ...settings,
      language,
    });
  };

  const handleUpdateTheme = (theme: Settings['theme']) => {
    if (!settings) return;
    updateSettingsMutation.mutate({
      ...settings,
      theme,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="h-10 bg-muted/50 rounded animate-pulse w-full"></div>
              <div className="h-20 bg-muted/50 rounded animate-pulse w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="account" value={activeTab} onValueChange={(value) => setActiveTab(value as "account" | "notifications" | "security")}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Settings
                </CardTitle>
                <CardDescription>
                  Configure your language and display preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings?.language}
                      onValueChange={handleUpdateLanguage}
                    >
                      <SelectTrigger id="language" className="w-full">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings?.theme}
                      onValueChange={handleUpdateTheme}
                    >
                      <SelectTrigger id="theme" className="w-full">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  App Preferences
                </CardTitle>
                <CardDescription>
                  Configure how the application behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-start trips</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically start trips when you begin a route
                    </p>
                  </div>
                  <Switch
                    checked={settings?.autoStartTrips}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ ...settings, autoStartTrips: checked })
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show earnings</Label>
                    <p className="text-sm text-muted-foreground">
                      Show real-time earnings in the app interface
                    </p>
                  </div>
                  <Switch
                    checked={settings?.showEarnings}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ ...settings, showEarnings: checked })
                    }
                  />
                </div>

                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice navigation</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable voice instructions for navigation
                    </p>
                  </div>
                  <Switch
                    checked={settings?.voiceNavigation}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ ...settings, voiceNavigation: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure which notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications on your device
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.pushEnabled}
                    onCheckedChange={() => handleToggleNotification("pushEnabled")}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New trip alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new trips are available
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.newTrips}
                    onCheckedChange={() => handleToggleNotification("newTrips")}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about payments and earnings
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.paymentUpdates}
                    onCheckedChange={() => handleToggleNotification("paymentUpdates")}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important system updates and announcements
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.systemAnnouncements}
                    onCheckedChange={() => handleToggleNotification("systemAnnouncements")}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.emailEnabled}
                    onCheckedChange={() => handleToggleNotification("emailEnabled")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Additional security settings for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-factor authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable additional security with two-factor authentication
                    </p>
                  </div>
                  <Switch
                    checked={settings?.security?.twoFactorEnabled}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ 
                        ...settings, 
                        security: { ...settings?.security, twoFactorEnabled: checked } 
                      })
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Biometric login</Label>
                    <p className="text-sm text-muted-foreground">
                      Use fingerprint or face recognition to log in
                    </p>
                  </div>
                  <Switch
                    checked={settings?.security?.biometricEnabled}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ 
                        ...settings, 
                        security: { ...settings?.security, biometricEnabled: checked } 
                      })
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Session Management</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      driverService.logoutAllDevices();
                      toast({
                        title: "All sessions terminated",
                        description: "You've been logged out from all other devices.",
                      });
                    }}
                  >
                    Logout from all devices
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Account Security</Label>
                  <Button 
                    variant="outline" 
                    className="w-full text-red-500 hover:text-red-600"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) {
                        driverService.deactivateAccount();
                      }
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Deactivate Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DriverSettings;