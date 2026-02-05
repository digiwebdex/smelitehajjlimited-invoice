 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 Deno.serve(async (req) => {
   // Handle CORS preflight
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // Get the authorization header
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) {
       return new Response(
         JSON.stringify({ error: "No authorization header" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Create Supabase client with user's token to verify they're admin
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 
     const userClient = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: authHeader } },
     });
 
     // Get the requesting user
     const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser();
     if (userError || !requestingUser) {
       return new Response(
         JSON.stringify({ error: "Unauthorized" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Check if requesting user is admin
     const { data: roleData, error: roleError } = await userClient
       .from("user_roles")
       .select("role")
       .eq("user_id", requestingUser.id)
       .eq("role", "admin")
       .maybeSingle();
 
     if (roleError || !roleData) {
       return new Response(
         JSON.stringify({ error: "Only admins can delete users" }),
         { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Get the user ID to delete from request body
     const { userId } = await req.json();
     if (!userId) {
       return new Response(
         JSON.stringify({ error: "User ID is required" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Prevent admin from deleting themselves
     if (userId === requestingUser.id) {
       return new Response(
         JSON.stringify({ error: "You cannot delete your own account" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Create admin client to delete user
     const adminClient = createClient(supabaseUrl, supabaseServiceKey);
 
     // Delete user from auth.users (this will cascade to profiles due to trigger)
     const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
 
     if (deleteError) {
       console.error("Error deleting user:", deleteError);
       return new Response(
         JSON.stringify({ error: deleteError.message }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     return new Response(
       JSON.stringify({ success: true }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Unexpected error:", error);
     return new Response(
       JSON.stringify({ error: "Internal server error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });