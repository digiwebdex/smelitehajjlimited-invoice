import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Building2, MapPin, Phone, Mail, Globe, MessageSquare } from "lucide-react";
import { useCompany, useUpdateCompany, Company } from "@/hooks/useCompanies";
import { BrandingPreview } from "@/components/admin/BrandingPreview";
import { LogoUpload } from "@/components/LogoUpload";
import { BrandSettings, defaultBranding } from "@/types/branding";

export default function CompanyBranding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: company, isLoading } = useCompany(id);
  const updateMutation = useUpdateCompany();

  const [formData, setFormData] = useState<Partial<Company>>({});

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const handleInputChange = (field: keyof Company, value: string | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        name: formData.name || "",
        tagline: formData.tagline || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        logo_url: formData.logo_url || undefined,
        address_line1: formData.address_line1 || undefined,
        address_line2: formData.address_line2 || undefined,
        website: typeof formData.website === "string" && formData.website.trim() ? formData.website.trim() : null,
        thank_you_text: formData.thank_you_text || undefined,
        show_qr_code: formData.show_qr_code ?? true,
        footer_alignment: formData.footer_alignment || "center",
      });
      toast({
        title: "Branding Saved",
        description: "Company branding settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save branding settings.",
        variant: "destructive",
      });
    }
  };

  const handleLogoChange = (url: string | undefined) => {
    handleInputChange("logo_url", url || null);
  };

  // Convert company data to BrandSettings for preview
  const brandingPreview: BrandSettings = {
    id: formData.id || "",
    company_name: formData.name || "Company Name",
    company_logo: formData.logo_url,
    tagline: formData.tagline,
    address_line1: formData.address_line1 || formData.address,
    address_line2: formData.address_line2,
    phone: formData.phone,
    email: formData.email,
    website: formData.website,
    thank_you_text: formData.thank_you_text || defaultBranding.thank_you_text,
    show_qr_code: formData.show_qr_code ?? true,
    footer_alignment: (formData.footer_alignment as "left" | "center" | "right") || "center",
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!company) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground">Company not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/companies")}>
            Back to Companies
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {company.name} - Branding
              </h1>
              <p className="text-muted-foreground">
                Customize invoice header and footer for this company
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-accent hover:bg-accent/90"
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Branding
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Form */}
          <div className="space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic company details for invoice headers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline || ""}
                    onChange={(e) => handleInputChange("tagline", e.target.value)}
                    placeholder="e.g., Excellence in Every Step"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <LogoUpload
                    currentLogo={formData.logo_url || undefined}
                    onLogoChange={handleLogoChange}
                    companyName={formData.name}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1 || ""}
                    onChange={(e) => handleInputChange("address_line1", e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address_line2"
                    value={formData.address_line2 || ""}
                    onChange={(e) => handleInputChange("address_line2", e.target.value)}
                    placeholder="Additional address info"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+880..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="info@company.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website || ""}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="www.company.com"
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Footer Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="thank_you_text">Thank You Message</Label>
                  <Textarea
                    id="thank_you_text"
                    value={formData.thank_you_text || ""}
                    onChange={(e) => handleInputChange("thank_you_text", e.target.value)}
                    placeholder="Thank you for staying with us."
                    rows={2}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_qr_code">Show QR Code</Label>
                    <p className="text-sm text-muted-foreground">
                      Display QR code on invoices for quick access
                    </p>
                  </div>
                  <Switch
                    id="show_qr_code"
                    checked={formData.show_qr_code ?? true}
                    onCheckedChange={(checked) => handleInputChange("show_qr_code", checked)}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="footer_alignment">Footer Alignment</Label>
                  <Select
                    value={formData.footer_alignment || "center"}
                    onValueChange={(value) => handleInputChange("footer_alignment", value)}
                  >
                    <SelectTrigger id="footer_alignment">
                      <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-6 h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  See how your branding will appear on invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandingPreview branding={brandingPreview} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
