import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Building2, Mail, Phone, MapPin, Calendar, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { mockCompanies } from "@/data/mockData";
import { Company } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { LogoUpload } from "@/components/LogoUpload";

export default function Companies() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const query = searchQuery.toLowerCase();
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(query) ||
        company.email.toLowerCase().includes(query) ||
        company.phone.toLowerCase().includes(query) ||
        company.address.toLowerCase().includes(query) ||
        (company.tagline && company.tagline.toLowerCase().includes(query))
    );
  }, [companies, searchQuery]);

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    email: "",
    phone: "",
    address: "",
    logo: undefined as string | undefined,
  });

  const resetForm = () => {
    setFormData({ name: "", tagline: "", email: "", phone: "", address: "", logo: undefined });
    setEditingCompany(null);
  };

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        tagline: company.tagline || "",
        email: company.email,
        phone: company.phone,
        address: company.address,
        logo: company.logo,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      setCompanies(
        companies.map((c) =>
          c.id === editingCompany.id
            ? { ...c, ...formData }
            : c
        )
      );
      toast({ title: "Company updated", description: `${formData.name} has been updated.` });
    } else {
      const newCompany: Company = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
      };
      setCompanies([...companies, newCompany]);
      toast({ title: "Company created", description: `${formData.name} has been added.` });
    }
    handleCloseDialog();
  };

  const handleDelete = () => {
    if (deleteCompanyId) {
      const company = companies.find((c) => c.id === deleteCompanyId);
      setCompanies(companies.filter((c) => c.id !== deleteCompanyId));
      toast({
        title: "Company deleted",
        description: `${company?.name} has been removed.`,
        variant: "destructive",
      });
      setDeleteCompanyId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Companies
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your company profiles
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? "Edit Company" : "Add New Company"}
                </DialogTitle>
                <DialogDescription>
                  {editingCompany
                    ? "Update the company information below."
                    : "Fill in the details to create a new company profile."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <LogoUpload
                  currentLogo={formData.logo}
                  onLogoChange={(logo) => setFormData({ ...formData, logo })}
                  companyName={formData.name}
                />
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) =>
                      setFormData({ ...formData, tagline: e.target.value })
                    }
                    placeholder="e.g., Excellence in Every Step"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="billing@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+880 1XXX XXXXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter full address"
                    rows={3}
                    required
                  />
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {editingCompany ? "Save Changes" : "Create Company"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Companies Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company, index) => (
            <div
              key={company.id}
              className="card-elevated p-6 space-y-4 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header with logo and actions */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-accent" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {company.name}
                    </h3>
                    {company.tagline && (
                      <p className="text-xs text-muted-foreground italic">
                        {company.tagline}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(company.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenDialog(company)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteCompanyId(company.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">
                    {company.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{company.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground line-clamp-2">
                    {company.address}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              No companies found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search query.
            </p>
          </div>
        )}

        {companies.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              No companies yet
            </h3>
            <p className="text-muted-foreground">
              Add your first company to get started.
            </p>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteCompanyId}
          onOpenChange={() => setDeleteCompanyId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Company</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this company? This action cannot
                be undone and will remove all associated invoices.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
