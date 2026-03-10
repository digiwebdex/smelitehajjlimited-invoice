import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
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
      const { data, error } = await api.get<{ is_admin: boolean }>("/admin/check");
      if (error) return false;
      return data?.is_admin ?? false;
    },
    enabled: !!user?.id,
  });

  // Check if current user is approved
  const { data: isApproved, isLoading: isCheckingApproval } = useQuery({
    queryKey: ["isApproved", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await api.get<{ is_approved: boolean }>("/admin/check-approval");
      if (error) return false;
      return data?.is_approved ?? false;
    },
    enabled: !!user?.id,
  });

  // Fetch all pending users (for admin)
  const { data: pendingUsers, isLoading: isLoadingPending } = useQuery({
    queryKey: ["pendingUsers"],
    queryFn: async () => {
      const { data, error } = await api.get<PendingUser[]>("/admin/pending-users");
      if (error) throw new Error(error);
      return data as PendingUser[];
    },
    enabled: isAdmin === true,
  });

  // Fetch all users (for admin)
  const { data: allUsers, isLoading: isLoadingAllUsers } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const { data, error } = await api.get<PendingUser[]>("/admin/users");
      if (error) throw new Error(error);
      return data as PendingUser[];
    },
    enabled: isAdmin === true,
  });

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await api.post(`/admin/approve-user`, { user_id: userId });
      if (error) throw new Error(error);
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
      const { error } = await api.post(`/admin/revoke-user`, { user_id: userId });
      if (error) throw new Error(error);
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await api.delete(`/admin/users/${userId}`);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast({
        title: "User deleted",
        description: "The user has been permanently removed from the system.",
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
    deleteUser: deleteUserMutation.mutate,
    isDeleting: deleteUserMutation.isPending,
    hasAccess: isAdmin || isApproved,
  };
}
