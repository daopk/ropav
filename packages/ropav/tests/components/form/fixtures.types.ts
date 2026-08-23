import type { FormValidationHostProps } from "../../fixtures/form-validation.types";
import type { FormRootProps } from "@/components/form";

export interface FormFixtureProps extends FormRootProps {
  /** Forwarded to a field nested inside the form, so context delivery is observable. */
  field?: FormValidationHostProps;
}
