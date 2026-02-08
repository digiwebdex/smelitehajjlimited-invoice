import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, useUpdateTheme, useResetTheme } from "@/hooks/useTheme";
import { useAdmin } from "@/hooks/useAdmin";
import type { ThemeSettings as ThemeSettingsType } from "@/types/theme";
import { defaultTheme } from "@/types/theme";
import { ColorPickerField } from "@/components/admin/ColorPickerField";
import { InvoicePreview } from "@/components/admin/InvoicePreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, RotateCcw, Palette, Eye, ArrowLeft } from "lucide-react";

const ThemeSettingsPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isCheckingAdmin } = useAdmin();
  const { data: savedTheme, isLoading: isThemeLoading } = useTheme();
  const updateTheme = useUpdateTheme();
  const resetTheme = useResetTheme();

  const [localTheme, setLocalTheme] = useState<ThemeSettingsType>(defaultTheme);

  useEffect(() => {
    if (savedTheme) {
      setLocalTheme(savedTheme);
    }
  }, [savedTheme]);

  useEffect(() => {
    if (!isCheckingAdmin && !isAdmin) {
      toast.error("You don't have permission to access this page");
      navigate("/");
    }
  }, [isAdmin, isCheckingAdmin, navigate]);

  const handleColorChange = (field: keyof ThemeSettingsType, value: string) => {
    setLocalTheme((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateTheme.mutateAsync(localTheme);
      toast.success("Theme saved successfully!");
    } catch (error) {
      toast.error("Failed to save theme");
      console.error(error);
    }
  };

  const handleReset = async () => {
    try {
      await resetTheme.mutateAsync();
      setLocalTheme(defaultTheme);
      toast.success("Theme reset to defaults!");
    } catch (error) {
      toast.error("Failed to reset theme");
      console.error(error);
    }
  };

  if (isCheckingAdmin || isThemeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Theme Settings
            </h1>
            <p className="text-muted-foreground">Customize invoice colors globally</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={resetTheme.isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={updateTheme.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateTheme.isPending ? "Saving..." : "Save Theme"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Color Settings */}
        <div className="space-y-4">
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Branding Colors</CardTitle>
                  <CardDescription>Main colors used throughout the invoice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ColorPickerField
                    label="Primary Color"
                    value={localTheme.primary_color}
                    onChange={(v) => handleColorChange("primary_color", v)}
                  />
                  <ColorPickerField
                    label="Secondary Color"
                    value={localTheme.secondary_color}
                    onChange={(v) => handleColorChange("secondary_color", v)}
                  />
                  <ColorPickerField
                    label="Accent Color"
                    value={localTheme.accent_color}
                    onChange={(v) => handleColorChange("accent_color", v)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Text Colors</CardTitle>
                  <CardDescription>Colors for various text elements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ColorPickerField
                    label="Header Text Color"
                    value={localTheme.header_text_color}
                    onChange={(v) => handleColorChange("header_text_color", v)}
                  />
                  <ColorPickerField
                    label="Invoice Title Color"
                    value={localTheme.invoice_title_color}
                    onChange={(v) => handleColorChange("invoice_title_color", v)}
                  />
                  <ColorPickerField
                    label="Subtotal Text Color"
                    value={localTheme.subtotal_text_color}
                    onChange={(v) => handleColorChange("subtotal_text_color", v)}
                  />
                  <ColorPickerField
                    label="Paid Text Color"
                    value={localTheme.paid_text_color}
                    onChange={(v) => handleColorChange("paid_text_color", v)}
                  />
                  <ColorPickerField
                    label="Footer Text Color"
                    value={localTheme.footer_text_color}
                    onChange={(v) => handleColorChange("footer_text_color", v)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Badge Colors</CardTitle>
                  <CardDescription>Colors for payment status indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ColorPickerField
                    label="Paid Badge Color"
                    value={localTheme.badge_paid_color}
                    onChange={(v) => handleColorChange("badge_paid_color", v)}
                  />
                  <ColorPickerField
                    label="Partial Badge Color"
                    value={localTheme.badge_partial_color}
                    onChange={(v) => handleColorChange("badge_partial_color", v)}
                  />
                  <ColorPickerField
                    label="Unpaid Badge Color"
                    value={localTheme.badge_unpaid_color}
                    onChange={(v) => handleColorChange("badge_unpaid_color", v)}
                  />
                  <ColorPickerField
                    label="Balance Background"
                    value={localTheme.balance_bg_color}
                    onChange={(v) => handleColorChange("balance_bg_color", v)}
                  />
                  <ColorPickerField
                    label="Balance Text Color"
                    value={localTheme.balance_text_color}
                    onChange={(v) => handleColorChange("balance_text_color", v)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Layout Colors</CardTitle>
                  <CardDescription>Colors for table and borders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ColorPickerField
                    label="Table Header Background"
                    value={localTheme.table_header_bg}
                    onChange={(v) => handleColorChange("table_header_bg", v)}
                  />
                  <ColorPickerField
                    label="Table Header Text"
                    value={localTheme.table_header_text}
                    onChange={(v) => handleColorChange("table_header_text", v)}
                  />
                  <ColorPickerField
                    label="Border Color"
                    value={localTheme.border_color}
                    onChange={(v) => handleColorChange("border_color", v)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your changes will look</CardDescription>
            </CardHeader>
            <CardContent className="bg-gray-50 rounded-lg p-4">
              <InvoicePreview theme={localTheme} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettingsPage;
