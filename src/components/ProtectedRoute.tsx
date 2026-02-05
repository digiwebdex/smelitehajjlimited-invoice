 import { Navigate, useLocation } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import { useAdmin } from "@/hooks/useAdmin";
 import { Loader2, Clock, LogOut } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import smEliteLogo from "@/assets/sm-elite-hajj-logo.jpeg";

 interface ProtectedRouteProps {
   children: React.ReactNode;
   requireAdmin?: boolean;
 }
 
 export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
   const { isAuthenticated, isLoading, logout } = useAuth();
   const { isAdmin, isApproved, isCheckingAdmin, isCheckingApproval, hasAccess } = useAdmin();
   const location = useLocation();
 
   // Show loading while checking auth state
   if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <p className="text-muted-foreground">Loading...</p>
         </div>
       </div>
     );
   }
 
   // Redirect to login if not authenticated
   if (!isAuthenticated) {
     return <Navigate to="/login" state={{ from: location }} replace />;
   }
 
   // Show loading while checking admin/approval status
   if (isCheckingAdmin || isCheckingApproval) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <p className="text-muted-foreground">Checking access...</p>
         </div>
       </div>
     );
   }
 
   // If admin is required but user is not admin
   if (requireAdmin && !isAdmin) {
     return <Navigate to="/" replace />;
   }
 
   // If user is not approved and not admin, show pending approval screen
   if (!hasAccess) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
         <div className="w-full max-w-md">
           <div className="flex flex-col items-center mb-8">
             <img 
               src={smEliteLogo} 
               alt="SM Elite Hajj Logo" 
               className="h-20 w-20 rounded-2xl shadow-lg mb-4 object-cover"
             />
             <h1 className="text-2xl font-bold text-foreground">S M Invoice Software</h1>
           </div>
 
           <Card className="shadow-xl border-border/50">
             <CardHeader className="text-center pb-4">
               <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
                 <Clock className="h-8 w-8 text-warning" />
               </div>
               <CardTitle className="text-xl">Approval Pending</CardTitle>
               <CardDescription>
                 Your account is awaiting admin approval. You will be able to access the system once an administrator approves your account.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground text-center">
                 Please contact your administrator if you need immediate access.
               </div>
               <Button 
                 variant="outline" 
                 className="w-full" 
                 onClick={() => logout()}
               >
                 <LogOut className="h-4 w-4 mr-2" />
                 Sign Out
               </Button>
             </CardContent>
           </Card>
         </div>
       </div>
     );
   }
 
   return <>{children}</>;
 }
