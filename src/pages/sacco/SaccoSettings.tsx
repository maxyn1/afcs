import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import saccoAdminService from "@/services/saccoAdminService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Save, RefreshCw, Shield, CreditCard, Users, Mail } from "lucide-react";

interface SaccoDetails {
  id: number;
  name: string;
  registration_number: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  founded_date: string;
  status: string;
  total_vehicles: number;
}

interface PaymentFormData {
  mpesa_business_number: string;
  payment_notification_email: string;
  auto_reconcile: boolean;
}

const SaccoSettings = () => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch SACCO details
  const { data: saccoData, isLoading } = useQuery({
    queryKey: ['saccoDetails'],
    queryFn: saccoAdminService.getSaccoDetails,
  });

  // Dummy data for demonstration
  const saccoDetails = saccoData || {
    id: 1,
    name: "Metro Trans",
    registration_number: "MT123",
    contact_email: "info@metrotrans.co.ke",
    contact_phone: "+254711111111",
    address: "123 Transport Avenue, Nairobi",
    founded_date: "2018-05-15",
    status: "active",
    total_vehicles: 24
  };

  // Update SACCO details mutation
  const updateSaccoMutation = useMutation({
    mutationFn: saccoAdminService.updateSaccoDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saccoDetails'] });
      toast({
        title: "Settings updated",
        description: "Your SACCO settings have been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update SACCO settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveChanges = (data) => {
    updateSaccoMutation.mutate(data);
  };

  // Payment Settings Form
  const formSchema = z.object({
    mpesa_business_number: z.string().min(6, "Business number must be at least 6 digits"),
    payment_notification_email: z.string().email("Invalid email address"),
    auto_reconcile: z.boolean().default(true),
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mpesa_business_number: "",
      payment_notification_email: "",
      auto_reconcile: true,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updatePaymentSettings = useMutation({
    mutationFn: (data: PaymentFormData) => saccoAdminService.updatePaymentSettings(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['saccoPaymentSettings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment settings",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    updatePaymentSettings.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payment">Payment Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SACCO Information</CardTitle>
              <CardDescription>
                View and edit your SACCO's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-4 text-center">Loading SACCO details...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">SACCO Name</Label>
                      <Input
                        id="name"
                        defaultValue={saccoDetails.name}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registration">Registration Number</Label>
                      <Input
                        id="registration"
                        defaultValue={saccoDetails.registration_number}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Contact Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={saccoDetails.contact_email}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Contact Phone</Label>
                      <Input
                        id="phone"
                        defaultValue={saccoDetails.contact_phone}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        defaultValue={saccoDetails.address}
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="founded">Founded Date</Label>
                      <Input
                        id="founded"
                        type="date"
                        defaultValue={saccoDetails.founded_date}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Input
                        id="status"
                        defaultValue={saccoDetails.status}
                        disabled
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Information
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure how your SACCO handles payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="mpesa_business_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>M-Pesa Business Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter business number" />
                        </FormControl>
                        <FormDescription>
                          The business number customers will use to make payments
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_notification_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Notification Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} placeholder="email@example.com" />
                        </FormControl>
                        <FormDescription>
                          Email address to receive payment notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="auto_reconcile"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Automatically reconcile payments
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Payment Settings"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your SACCO's security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Current Password</Label>
                <Input id="password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input id="new_password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input id="confirm_password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive notifications via SMS
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Alerts</p>
                  <p className="text-sm text-gray-500">
                    Get notified about new payments
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Updates</p>
                  <p className="text-sm text-gray-500">
                    Get notified about system updates
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Save Notification Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SaccoSettings;