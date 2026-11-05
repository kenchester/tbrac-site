"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { PortalHeader } from "@/components/portal-header";
import { useCreateCustomer } from "@/hooks/use-customers";
import { useApiToast } from "@/hooks/use-api-toast";
import {
  IndustrySector,
  OwnershipType,
  type CustomerCreate,
} from "@/lib/api-types";
import {
  formatIndustrySector,
  formatOwnershipType,
} from "@/lib/format-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

function NewCustomerContent() {
  const router = useRouter();
  const { create, loading } = useCreateCustomer();
  const { handleError, showSuccess } = useApiToast();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<CustomerCreate>({
    name: "",
    chinese_name: "",
    industry_sector: IndustrySector.TECHNOLOGY,
    ownership_type: OwnershipType.PRIVATE,
    state_ownership_percentage: undefined,
    headquarters_country: "",
    headquarters_city: "",
    us_presence: "",
    us_subsidiary_name: "",
    parent_company_id: "",
    website: "",
    notes: "",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t("newCustomerErrName");
    }

    if (!(formData.headquarters_country ?? "").trim()) {
      errors.headquarters_country = t("newCustomerErrCountry");
    }

    if (
      formData.state_ownership_percentage !== undefined &&
      formData.state_ownership_percentage !== null
    ) {
      const percentage = Number(formData.state_ownership_percentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        errors.state_ownership_percentage = t("newCustomerErrPercentage");
      }
    }


    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const cleanedData: CustomerCreate = {
        ...formData,
        chinese_name: formData.chinese_name || undefined,
        headquarters_city: formData.headquarters_city || undefined,
        us_presence: formData.us_presence || undefined,
        us_subsidiary_name: formData.us_subsidiary_name || undefined,
        parent_company_id: formData.parent_company_id || undefined,
        website: formData.website || undefined,
        notes: formData.notes || undefined,
        state_ownership_percentage:
          formData.state_ownership_percentage !== undefined &&
          formData.state_ownership_percentage !== null
            ? Number(formData.state_ownership_percentage)
            : undefined,
      };

      const customer = await create(cleanedData);
      if (customer) {
        showSuccess(t("newCustomerSuccess"));
        router.push(`/customers/${customer.id}`);
      }
    } catch (err) {
      handleError(err);
    }
  };

  const updateField = (field: keyof CustomerCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const showStateOwnership =
    formData.ownership_type === OwnershipType.STATE_OWNED ||
    formData.ownership_type === OwnershipType.MIXED;

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/customers")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{t("newCustomerTitle")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("newCustomerSubtitle")}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>{t("newCustomerCardTitle")}</CardTitle>
                <CardDescription>
                  {t("newCustomerCardDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("newCustomerBasicInfo")}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {t("newCustomerCompanyName")} <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="e.g., ByteDance"
                      />
                      {validationErrors.name && (
                        <p className="text-sm text-red-600">
                          {validationErrors.name}
                        </p>
                      )}
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="industry_sector">
                        {t("newCustomerIndustry")} <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={formData.industry_sector}
                        onValueChange={(val) =>
                          updateField("industry_sector", val as IndustrySector)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(IndustrySector).map((sector) => (
                            <SelectItem key={sector} value={sector}>
                              {formatIndustrySector(sector)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownership_type">
                        {t("newCustomerOwnership")} <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={formData.ownership_type}
                        onValueChange={(val) =>
                          updateField("ownership_type", val as OwnershipType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(OwnershipType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {formatOwnershipType(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {showStateOwnership && (
                    <div className="space-y-2">
                      <Label htmlFor="state_ownership_percentage">
                        {t("newCustomerStateOwnership")}
                      </Label>
                      <Input
                        id="state_ownership_percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.state_ownership_percentage ?? ""}
                        onChange={(e) =>
                          updateField(
                            "state_ownership_percentage",
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                        placeholder="e.g., 51"
                      />
                      {validationErrors.state_ownership_percentage && (
                        <p className="text-sm text-red-600">
                          {validationErrors.state_ownership_percentage}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("newCustomerLocation")}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="headquarters_country">
                        {t("newCustomerHQCountry")}{" "}
                        <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="headquarters_country"
                        value={formData.headquarters_country}
                        onChange={(e) =>
                          updateField("headquarters_country", e.target.value)
                        }
                        placeholder="e.g., China"
                      />
                      {validationErrors.headquarters_country && (
                        <p className="text-sm text-red-600">
                          {validationErrors.headquarters_country}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headquarters_city">
                        {t("newCustomerHQCity")}
                      </Label>
                      <Input
                        id="headquarters_city"
                        value={formData.headquarters_city}
                        onChange={(e) =>
                          updateField("headquarters_city", e.target.value)
                        }
                        placeholder="e.g., Beijing"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* US Presence */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("newCustomerUSPresence")}</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="us_presence">{t("newCustomerUSPresenceDetails")}</Label>
                      <Textarea
                        id="us_presence"
                        value={formData.us_presence}
                        onChange={(e) =>
                          updateField("us_presence", e.target.value)
                        }
                        placeholder={t("newCustomerUSPresencePlaceholder")}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="us_subsidiary_name">
                        {t("newCustomerUSSubsidiary")}
                      </Label>
                      <Input
                        id="us_subsidiary_name"
                        value={formData.us_subsidiary_name}
                        onChange={(e) =>
                          updateField("us_subsidiary_name", e.target.value)
                        }
                        placeholder="e.g., Example Battery Materials Co."
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {t("newCustomerAdditional")}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">{t("newCustomerWebsite")}</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateField("website", e.target.value)}
                        placeholder="https://example.com"
                      />
                      {validationErrors.website && (
                        <p className="text-sm text-red-600">
                          {validationErrors.website}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">{t("newCustomerNotes")}</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        placeholder={t("newCustomerNotesPlaceholder")}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/customers")}
                    disabled={loading}
                  >
                    {t("newCustomerCancel")}
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? t("newCustomerCreating") : t("newCustomerCreate")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewCustomerPage() {
  return (
    <ProtectedRoute>
      <NewCustomerContent />
    </ProtectedRoute>
  );
}
