import * as Yup from "yup";

const employeeSchemas = [
  // Step 0: Employee Details
  Yup.object().shape({
    salutation: Yup.string().required("Salutation is required"),
    firstName: Yup.string().required("First name is required"),
    middleName: Yup.string().required("Middle name is required"),
    lastName: Yup.string().required("Last name is required"),
    gender: Yup.string().required("Gender is required"),
    dob: Yup.string()
      .required("Date of Birth is required")
      .test('age-range', 'Age must be between 18 and 90 years', function (value) {
        if (!value) return false;
        const dob = new Date(value);
        const today = new Date();
        const ageDifMs = today - dob;
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        // Age must be between 18 and 90 years
        return age >= 18 && age <= 90;
      }),
    nationality: Yup.string().required("Nationality is required"),
  }),

  // Step 1: Contact Details
  Yup.object().shape({
    contactNumber: Yup.string()
      .required("Contact number is required")
      .matches(/^\d{10}$/, "Must be 10 digits"),
    email: Yup.string()
      .required("Email is required")
      .email("Invalid email address"),
  }),

  // Step 2: Other Details
  Yup.object().shape({
    relationType: Yup.string().required("Relation type is required"),
    relationName: Yup.string().required("Relation name is required"),
    altNumber: Yup.string()
      .nullable()
      .matches(/^\d{10}$/, "Must be 10 digits")
      .notRequired(),
    altNumberType: Yup.string().required("Alternative number type is required"),
  }),

  // Step 3: Address
  Yup.object().shape({
    country: Yup.string().required("Country is required"),
    state: Yup.string().required("State is required"),
    district: Yup.string().required("District is required"),
    block: Yup.string().required("Block (mandal) is required"),
    village: Yup.string().required("Village is required"),
    zipcode: Yup.string()
      .required("Zipcode is required")
      .matches(/^\d{6}$/, "Zipcode must be 6 digits"),
  }),

  // Step 4: Professional Details
  Yup.object().shape({
    education: Yup.string().required("Education is required"),
    experience: Yup.string()
      .required("Experience is required")
      .matches(/^\d+$/, "Experience must be a number in years"),
  }),

  // Step 5: Bank Details
  Yup.object().shape({
    bankName: Yup.string().required("Bank name is required"),
    accountNumber: Yup.string()
      .required("Account number is required")
      .matches(/^\d+$/, "Only digits allowed"),
    branchName: Yup.string().required("Branch name is required"),
    ifscCode: Yup.string()
      .required("IFSC code is required")
      .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  }),

  // Step 6: Documents
  Yup.object().shape({
    documentType: Yup.string().required("Document Type is required"),
    documentNumber: Yup.string().when("documentType", {
      is: (val) => val && val !== "ppbNumber",
      then: (schema) => schema.required("Document number is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  }),

  // Step 7: Portal Access
  Yup.object().shape({
    role: Yup.string().required("Role is required"),
    accessStatus: Yup.string().required("Access status is required"),
  }),
];

export default employeeSchemas;