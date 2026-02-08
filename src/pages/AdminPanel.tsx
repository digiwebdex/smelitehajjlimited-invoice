 import { useState } from "react";
 import { Navigate, useNavigate } from "react-router-dom";
 import { useAdmin } from "@/hooks/useAdmin";
 import { useAuth } from "@/contexts/AuthContext";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Loader2, UserCheck, UserX, Users, Clock, CheckCircle, Trash2, Palette, Building2 } from "lucide-react";
 import { format } from "date-fns";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from "@/components/ui/alert-dialog";
 
export default function AdminPanel() {
   const navigate = useNavigate();
   const { user } = useAuth();
   const {
     isAdmin,
     isCheckingAdmin,
     pendingUsers,
     allUsers,
     isLoadingPending,
     isLoadingAllUsers,
     approveUser,
     revokeUser,
     isApproving,
     isRevoking,
     deleteUser,
     isDeleting,
   } = useAdmin();
 
   const [activeTab, setActiveTab] = useState("pending");
   const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

   const handleDeleteUser = () => {
     if (userToDelete) {
       deleteUser(userToDelete.id);
       setUserToDelete(null);
     }
   };
 
   // Show loading while checking admin status
   if (isCheckingAdmin) {
     return (
       <AppLayout>
         <div className="flex items-center justify-center h-64">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       </AppLayout>
     );
   }
 
   // Redirect non-admins
   if (!isAdmin) {
     return <Navigate to="/" replace />;
   }
 
   const approvedUsers = allUsers.filter((u) => u.is_approved && u.user_id !== user?.id);
   const pendingCount = pendingUsers.length;
   const approvedCount = approvedUsers.length;
 
   return (
     <AppLayout>
       <div className="space-y-6">
         {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage user access and approvals</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate("/admin/branding")} variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Branding
              </Button>
              <Button onClick={() => navigate("/admin/theme")} variant="outline">
                <Palette className="h-4 w-4 mr-2" />
                Theme
              </Button>
            </div>
          </div>
 
         {/* Stats */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
               <Clock className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{pendingCount}</div>
               <p className="text-xs text-muted-foreground">Users waiting for approval</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium">Approved Users</CardTitle>
               <CheckCircle className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{approvedCount}</div>
               <p className="text-xs text-muted-foreground">Active users in the system</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium">Total Users</CardTitle>
               <Users className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{allUsers.length}</div>
               <p className="text-xs text-muted-foreground">All registered users</p>
             </CardContent>
           </Card>
         </div>
 
         {/* Users Table */}
         <Card>
           <CardHeader>
             <CardTitle>User Management</CardTitle>
             <CardDescription>Approve or revoke user access to the system</CardDescription>
           </CardHeader>
           <CardContent>
             <Tabs value={activeTab} onValueChange={setActiveTab}>
               <TabsList className="mb-4">
                 <TabsTrigger value="pending" className="relative">
                   Pending
                   {pendingCount > 0 && (
                     <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                       {pendingCount}
                     </Badge>
                   )}
                 </TabsTrigger>
                 <TabsTrigger value="approved">Approved</TabsTrigger>
                 <TabsTrigger value="all">All Users</TabsTrigger>
               </TabsList>
 
               <TabsContent value="pending">
                 {isLoadingPending ? (
                   <div className="flex items-center justify-center h-32">
                     <Loader2 className="h-6 w-6 animate-spin text-primary" />
                   </div>
                 ) : pendingUsers.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground">
                     <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                     <p>No pending approvals</p>
                   </div>
                 ) : (
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Name</TableHead>
                         <TableHead>Registered</TableHead>
                         <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {pendingUsers.map((pendingUser) => (
                         <TableRow key={pendingUser.id}>
                           <TableCell className="font-medium">
                             {pendingUser.full_name || "No name provided"}
                           </TableCell>
                           <TableCell>
                             {format(new Date(pendingUser.created_at), "MMM d, yyyy HH:mm")}
                           </TableCell>
                           <TableCell className="text-right">
                               <div className="flex items-center justify-end gap-2">
                                 <Button
                                   size="sm"
                                   onClick={() => approveUser(pendingUser.user_id)}
                                   disabled={isApproving}
                                 >
                                   {isApproving ? (
                                     <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                   ) : (
                                     <UserCheck className="h-4 w-4 mr-1" />
                                   )}
                                   Approve
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="destructive"
                                   onClick={() => setUserToDelete({ 
                                     id: pendingUser.user_id, 
                                     name: pendingUser.full_name || "this user" 
                                   })}
                                   disabled={isDeleting}
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </div>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 )}
               </TabsContent>
 
               <TabsContent value="approved">
                 {isLoadingAllUsers ? (
                   <div className="flex items-center justify-center h-32">
                     <Loader2 className="h-6 w-6 animate-spin text-primary" />
                   </div>
                 ) : approvedUsers.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground">
                     <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                     <p>No approved users yet</p>
                   </div>
                 ) : (
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Name</TableHead>
                         <TableHead>Registered</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {approvedUsers.map((approvedUser) => (
                         <TableRow key={approvedUser.id}>
                           <TableCell className="font-medium">
                             {approvedUser.full_name || "No name provided"}
                           </TableCell>
                           <TableCell>
                             {format(new Date(approvedUser.created_at), "MMM d, yyyy")}
                           </TableCell>
                           <TableCell>
                               <Badge className="bg-primary text-primary-foreground">
                               Approved
                             </Badge>
                           </TableCell>
                           <TableCell className="text-right">
                               <div className="flex items-center justify-end gap-2">
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => revokeUser(approvedUser.user_id)}
                                   disabled={isRevoking}
                                 >
                                   {isRevoking ? (
                                     <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                   ) : (
                                     <UserX className="h-4 w-4 mr-1" />
                                   )}
                                   Revoke
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="destructive"
                                   onClick={() => setUserToDelete({ 
                                     id: approvedUser.user_id, 
                                     name: approvedUser.full_name || "this user" 
                                   })}
                                   disabled={isDeleting}
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </div>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 )}
               </TabsContent>
 
               <TabsContent value="all">
                 {isLoadingAllUsers ? (
                   <div className="flex items-center justify-center h-32">
                     <Loader2 className="h-6 w-6 animate-spin text-primary" />
                   </div>
                 ) : allUsers.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground">
                     <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                     <p>No users found</p>
                   </div>
                 ) : (
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Name</TableHead>
                         <TableHead>Registered</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {allUsers
                         .filter((u) => u.user_id !== user?.id)
                         .map((userItem) => (
                           <TableRow key={userItem.id}>
                             <TableCell className="font-medium">
                               {userItem.full_name || "No name provided"}
                             </TableCell>
                             <TableCell>
                               {format(new Date(userItem.created_at), "MMM d, yyyy")}
                             </TableCell>
                             <TableCell>
                               {userItem.is_approved ? (
                                 <Badge className="bg-primary text-primary-foreground">
                                   Approved
                                 </Badge>
                               ) : (
                                 <Badge variant="secondary">Pending</Badge>
                               )}
                             </TableCell>
                             <TableCell className="text-right">
                               {userItem.is_approved ? (
                                   <div className="flex items-center justify-end gap-2">
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => revokeUser(userItem.user_id)}
                                       disabled={isRevoking}
                                     >
                                       <UserX className="h-4 w-4 mr-1" />
                                       Revoke
                                     </Button>
                                     <Button
                                       size="sm"
                                       variant="destructive"
                                       onClick={() => setUserToDelete({ 
                                         id: userItem.user_id, 
                                         name: userItem.full_name || "this user" 
                                       })}
                                       disabled={isDeleting}
                                     >
                                       <Trash2 className="h-4 w-4" />
                                     </Button>
                                   </div>
                               ) : (
                                   <div className="flex items-center justify-end gap-2">
                                     <Button
                                       size="sm"
                                       onClick={() => approveUser(userItem.user_id)}
                                       disabled={isApproving}
                                     >
                                       <UserCheck className="h-4 w-4 mr-1" />
                                       Approve
                                     </Button>
                                     <Button
                                       size="sm"
                                       variant="destructive"
                                       onClick={() => setUserToDelete({ 
                                         id: userItem.user_id, 
                                         name: userItem.full_name || "this user" 
                                       })}
                                       disabled={isDeleting}
                                     >
                                       <Trash2 className="h-4 w-4" />
                                     </Button>
                                   </div>
                               )}
                             </TableCell>
                           </TableRow>
                         ))}
                     </TableBody>
                   </Table>
                 )}
               </TabsContent>
             </Tabs>
           </CardContent>
         </Card>

         {/* Delete Confirmation Dialog */}
         <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
           <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>Delete User</AlertDialogTitle>
               <AlertDialogDescription>
                 Are you sure you want to permanently delete {userToDelete?.name}? This action cannot be undone and will remove all their data from the system.
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <AlertDialogAction
                 onClick={handleDeleteUser}
                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               >
                 {isDeleting ? (
                   <>
                     <Loader2 className="h-4 w-4 animate-spin mr-1" />
                     Deleting...
                   </>
                 ) : (
                   "Delete User"
                 )}
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
       </div>
     </AppLayout>
   );
 }