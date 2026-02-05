 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 
 interface PendingUser {
   id: string;
   user_id: string;
   full_name: string | null;
   is_approved: boolean;
   created_at: string;
   email?: string;
 }
 
 export function useAdmin() {
   const { user } = useAuth();
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   // Check if current user is admin
   const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
     queryKey: ["isAdmin", user?.id],
     queryFn: async () => {
       if (!user?.id) return false;
       
       const { data, error } = await supabase
         .from("user_roles")
         .select("role")
         .eq("user_id", user.id)
         .eq("role", "admin")
         .maybeSingle();
       
       if (error) {
         console.error("Error checking admin status:", error);
         return false;
       }
       
       return !!data;
     },
     enabled: !!user?.id,
   });
 
   // Check if current user is approved
   const { data: isApproved, isLoading: isCheckingApproval } = useQuery({
     queryKey: ["isApproved", user?.id],
     queryFn: async () => {
       if (!user?.id) return false;
       
       const { data, error } = await supabase
         .from("profiles")
         .select("is_approved")
         .eq("user_id", user.id)
         .maybeSingle();
       
       if (error) {
         console.error("Error checking approval status:", error);
         return false;
       }
       
       return data?.is_approved ?? false;
     },
     enabled: !!user?.id,
   });
 
   // Fetch all pending users (for admin)
   const { data: pendingUsers, isLoading: isLoadingPending } = useQuery({
     queryKey: ["pendingUsers"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("profiles")
         .select("*")
         .eq("is_approved", false)
         .order("created_at", { ascending: false });
       
       if (error) throw error;
       return data as PendingUser[];
     },
     enabled: isAdmin === true,
   });
 
   // Fetch all users (for admin)
   const { data: allUsers, isLoading: isLoadingAllUsers } = useQuery({
     queryKey: ["allUsers"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("profiles")
         .select("*")
         .order("created_at", { ascending: false });
       
       if (error) throw error;
       return data as PendingUser[];
     },
     enabled: isAdmin === true,
   });
 
   // Approve user mutation
   const approveUserMutation = useMutation({
     mutationFn: async (userId: string) => {
       const { error } = await supabase
         .from("profiles")
         .update({ is_approved: true })
         .eq("user_id", userId);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
       queryClient.invalidateQueries({ queryKey: ["allUsers"] });
       toast({
         title: "User approved",
         description: "The user can now access the system.",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     },
   });
 
   // Revoke user access mutation
   const revokeUserMutation = useMutation({
     mutationFn: async (userId: string) => {
       const { error } = await supabase
         .from("profiles")
         .update({ is_approved: false })
         .eq("user_id", userId);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
       queryClient.invalidateQueries({ queryKey: ["allUsers"] });
       toast({
         title: "Access revoked",
         description: "The user can no longer access the system.",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     },
   });
 
   return {
     isAdmin: isAdmin ?? false,
     isApproved: isApproved ?? false,
     isCheckingAdmin,
     isCheckingApproval,
     pendingUsers: pendingUsers ?? [],
     allUsers: allUsers ?? [],
     isLoadingPending,
     isLoadingAllUsers,
     approveUser: approveUserMutation.mutate,
     revokeUser: revokeUserMutation.mutate,
     isApproving: approveUserMutation.isPending,
     isRevoking: revokeUserMutation.isPending,
     hasAccess: isAdmin || isApproved,
   };
 }