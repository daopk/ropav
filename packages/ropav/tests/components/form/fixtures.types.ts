import type { FormValidationHostProps } from "../../fixtures/form-validation.types";
import type { FormProps } from "@/components/form";

export interface FormFixtureProps extends FormProps {
  /** Forwarded to a field nested inside the form, so context delivery is observable. */
  field?: FormValidationHostProps;
}
