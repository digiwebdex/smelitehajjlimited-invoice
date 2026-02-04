import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, AlertCircle, FileText, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { CompanyRevenueItem } from "@/components/dashboard/CompanyRevenueItem";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { mockCompanies, mockInvoices, calculateRevenueStats } from "@/data/mockData";

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = calculateRevenueStats(mockInvoices, mockCompanies);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCompanyClick = (companyId: string) => {
    navigate(`/companies/${companyId}`);
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your invoice management
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            subtitle="From paid installments"
            icon={<DollarSign className="h-6 w-6" />}
            variant="revenue"
          />
          <StatCard
            title="Total Due"
            value={formatCurrency(stats.totalDue)}
            subtitle="Pending payments"
            icon={<AlertCircle className="h-6 w-6" />}
            variant="due"
          />
          <StatCard
            title="Total Invoices"
            value={stats.totalInvoices}
            subtitle="All time"
            icon={<FileText className="h-6 w-6" />}
            variant="invoices"
          />
        </div>

        {/* Charts and Company Revenue */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Revenue Chart */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">
                Monthly Revenue
              </h2>
            </div>
            <RevenueChart data={stats.monthlyRevenue} />
          </div>

          {/* Company Revenue Breakdown */}
          <div className="card-elevated p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Company Revenue
              </h2>
              <p className="text-sm text-muted-foreground">
                Click to view income statement
              </p>
            </div>
            <div className="space-y-3">
              {stats.companyRevenue.map((company) => (
                <CompanyRevenueItem
                  key={company.companyId}
                  name={company.companyName}
                  revenue={company.revenue}
                  percentage={
                    stats.totalRevenue > 0
                      ? (company.revenue / stats.totalRevenue) * 100
                      : 0
                  }
                  onClick={() => handleCompanyClick(company.companyId)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
