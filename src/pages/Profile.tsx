
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Key, Phone, Mail, Save } from "lucide-react";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+254 712 345 678",
    password: "••••••••",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // In a real app, send update to backend
    console.log("Saving profile:", profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <User size={24} />
                My Profile
              </CardTitle>
              <Button 
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-gray-400" />
                  <Input
                    id="fullName"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center">
                  <Mail className="mr-2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center">
                  <Phone className="mr-2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex items-center">
                  <Key className="mr-2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={profile.password}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
              
              {isEditing && (
                <Button 
                  className="w-full mt-6" 
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-sm text-gray-500">Receive payment and transaction alerts</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">Email</Button>
                  <Button variant="outline" size="sm">SMS</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <h3 className="font-medium">Security</h3>
                  <p className="text-sm text-gray-500">Manage account security settings</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <h3 className="font-medium text-destructive">Delete Account</h3>
                  <p className="text-sm text-gray-500">Permanently delete your account and data</p>
                </div>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
