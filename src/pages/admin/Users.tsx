import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import saccoService from "@/services/saccoService";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { 
  UserPlus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Search 
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  saccoId?: string | null;  // Keep as string to match backend response
  saccoName?: string | null;
  lastLogin?: string;
  // Additional fields for drivers
  licenseNumber?: string;
  licenseExpiry?: string;
  driverId?: number;
  rating?: number;
  totalTrips?: number;
  vehicleId?: number;
  vehicleNumber?: string;
}

interface Sacco {
  id: number;
  name: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  status: string;
  saccoId: string | null;  // Change to string to match User interface
  licenseNumber?: string;
  licenseExpiry?: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [saccos, setSaccos] = useState<Sacco[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "passenger",
    status: "active",
    saccoId: null,
    licenseNumber: "",
    licenseExpiry: ""
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getUsers();
      // No need to map saccoId since we keep it as string
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSaccos = async () => {
    try {
      const data = await saccoService.getSaccos();
      setSaccos(data);
    } catch (error) {
      console.error('Error loading saccos:', error);
      toast({
        title: "Error",
        description: "Failed to load saccos",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadUsers();
    loadSaccos();
  }, []);

  const validateForm = (data: typeof formData) => {
    const errors: Record<string, string> = {};
    
    if (!data.fullName?.trim()) errors.fullName = "Full name is required";
    if (!data.email?.trim()) errors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Invalid email format";
    if (!data.phone?.trim()) errors.phone = "Phone number is required";
    if (data.password && data.password.length < 8) errors.password = "Password must be at least 8 characters";

    // Role specific validation
    if (data.role === "sacco_admin" && !data.saccoId) {
      errors.saccoId = "SACCO assignment is required for SACCO admin";
    }

    if (data.role === "driver") {
      if (!data.licenseNumber?.trim()) errors.licenseNumber = "License number is required for drivers";
      if (!data.licenseExpiry?.trim()) errors.licenseExpiry = "License expiry date is required for drivers";
      if (!data.saccoId) errors.saccoId = "SACCO assignment is required for drivers";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  const handleCreateUser = async () => {
    const errors = validateForm(formData);
    if (errors) {
      Object.entries(errors).forEach(([field, message]) => {
        toast({
          title: `Invalid ${field}`,
          description: message,
          variant: "destructive"
        });
      });
      return;
    }

    try {
      // Convert saccoId to string or null as expected by adminService
      const createData = {
        ...formData,
        saccoId: formData.saccoId !== null ? String(formData.saccoId) : null,
      };
      await adminService.createUser(createData);
      toast({
        title: "Success",
        description: "User created successfully"
      });
      setIsAddDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Convert saccoId to string or null as expected by adminService
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        saccoId: formData.saccoId !== null ? String(formData.saccoId) : null,
      };
      await adminService.updateUser(selectedUser.id, updateData);
      toast({
        title: "Success",
        description: "User updated successfully"
      });
      setIsEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    }
  };


  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await adminService.deleteUser(userId);
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.changeUserRole(userId, newRole);
      toast({
        title: "Success",
        description: "User role updated successfully"
      });
      loadUsers();
    } catch (error) {
      console.error('Error changing user role:', error);
      toast({
        title: "Error",
        description: "Failed to change user role",
        variant: "destructive"
      });
    }
  };

  const handleSaccoChange = (value: string | null) => {
    setFormData({
      ...formData,
      saccoId: value
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
        <Button 
          className="flex items-center gap-2"
          onClick={() => {
            setFormData({
              fullName: "",
              email: "",
              phone: "",
              password: "",
              role: "passenger",
              status: "active",
              saccoId: null,
            });
            setIsAddDialogOpen(true);
          }}
        >
          <UserPlus size={18} />
          <span>Add User</span>
        </Button>
      </div>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    role: value,
                    // Clear role-specific fields when role changes
                    licenseNumber: value === "driver" ? formData.licenseNumber : undefined,
                    licenseExpiry: value === "driver" ? formData.licenseExpiry : undefined,
                    saccoId: ["driver", "sacco_admin"].includes(value) ? formData.saccoId : null
                  });
                }}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger">Passenger</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="sacco_admin">SACCO Admin</SelectItem>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SACCO selection for SACCO admins and drivers */}
            {(formData.role === "sacco_admin" || formData.role === "driver") && (
              <div className="space-y-2">
                <Label htmlFor="sacco">SACCO Assignment</Label>
                <Select
                  value={formData.saccoId !== null ? String(formData.saccoId) : ""}
                  onValueChange={(value) => handleSaccoChange(value)}
                >
                  <SelectTrigger id="sacco">
                    <SelectValue placeholder="Select SACCO" />
                  </SelectTrigger>
                  <SelectContent>
                    {saccos.map(sacco => (
                      <SelectItem key={sacco.id} value={String(sacco.id)}>
                        {sacco.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Driver-specific fields */}
            {formData.role === "driver" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      placeholder="License Number"
                      value={formData.licenseNumber || ""}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseExpiry">License Expiry</Label>
                    <Input
                      id="licenseExpiry"
                      type="date"
                      value={formData.licenseExpiry || ""}
                      onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                </div>
              </>
            )}

            <Button onClick={handleCreateUser}>Create User</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input
                  id="edit-fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  placeholder="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    role: value,
                    // Clear role-specific fields when role changes
                    licenseNumber: value === "driver" ? formData.licenseNumber : undefined,
                    licenseExpiry: value === "driver" ? formData.licenseExpiry : undefined,
                    saccoId: ["driver", "sacco_admin"].includes(value) ? formData.saccoId : null
                  });
                }}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger">Passenger</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="sacco_admin">SACCO Admin</SelectItem>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SACCO selection for SACCO admins and drivers */}
            {(formData.role === "sacco_admin" || formData.role === "driver") && (
              <div className="space-y-2">
                <Label htmlFor="edit-sacco">SACCO Assignment</Label>
                <Select
                  value={formData.saccoId !== null ? String(formData.saccoId) : ""}
                  onValueChange={(value) => handleSaccoChange(value)}
                >
                  <SelectTrigger id="edit-sacco">
                    <SelectValue placeholder="Select SACCO" />
                  </SelectTrigger>
                  <SelectContent>
                    {saccos.map(sacco => (
                      <SelectItem key={sacco.id} value={String(sacco.id)}>
                        {sacco.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Driver-specific fields */}
            {formData.role === "driver" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-licenseNumber">License Number</Label>
                    <Input
                      id="edit-licenseNumber"
                      placeholder="License Number"
                      value={formData.licenseNumber || ""}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-licenseExpiry">License Expiry</Label>
                    <Input
                      id="edit-licenseExpiry"
                      type="date"
                      value={formData.licenseExpiry || ""}
                      onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SACCO</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "system_admin" ? "default" : "outline"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === "active" ? "secondary" : "outline"}
                          className={
                            user.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.saccoName || "-"}</TableCell>
                      <TableCell>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUser(user);
                                setFormData({
                                  fullName: user.name,
                                  email: user.email,
                                  phone: user.phone || "",
                                  password: "",
                                  role: user.role,
                                  status: user.status,
                                  saccoId: user.saccoId || null,
                                });
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} 
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink 
                      href="#" 
                      isActive={currentPage === index + 1}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
