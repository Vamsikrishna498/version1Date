// src/validations/stepSchemas.js
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

 const stepSchemas = [
  // Step 0: Personal Information schema
     yup.object().shape({
     firstName: yup.string()
      .required("First Name is required")
      .matches(/^[A-Za-z]{2,26}$/, "First Name must be 2–26 letters only"),
     middleName: yup.string()
      .required("Middle Name is required")
      .matches(/^[A-Za-z]{1,26}$/, "Middle Name must contain only letters"),
     lastName: yup.string()
      .required("Last Name is required")
      .matches(/^[A-Za-z]{2,26}$/, "Last Name must be 2–26 letters only"),
     gender: yup.string().required("Gender is required"),
     salutation: yup.string()
      .required("Salutation is required")
      .oneOf(["Mr.", "Mrs.", "Ms.", "Miss.", "Dr."], "Select a valid salutation"),
     nationality: yup.mixed()
      .required("Nationality is required")
      .transform((value) =>
        typeof value === "object" && value?.value ? value.value : value
      )
      .test("is-string", "Nationality must be a string", (value) => typeof value === "string"),
     dateOfBirth: yup.string()
      .required("Date of Birth is required")
      .test("age-range", "Age must be between 18 and 90 years", function (value) {
      if (!value) return false;
       const dob = new Date(value);
       const today = new Date();
       const age = today.getFullYear() - dob.getFullYear();
       const m = today.getMonth() - dob.getMonth();
       const isBirthdayPassed = m > 0 || (m === 0 && today.getDate() >= dob.getDate());
 
       const actualAge = isBirthdayPassed ? age : age - 1;
       return actualAge >= 18 && actualAge <= 90;
       }),
 
     fatherName: yup
      .string()
      .required("Father Name is required")
      .matches(/^[A-Za-z\s]{2,40}$/, "Father Name must contain only letters"),
     alternativeNumber: yup
      .string()
      .required("Alternative number is required")
      .matches(/^\d{10}$/, "Enter a valid 10-digit alternative number"),
     contactNumber: yup
       .string()
       .notRequired()
       .test('phone-validation', 'Enter a valid 10-digit contact number', function(value) {
         // If no value provided, it's valid (not required)
         if (!value || value.trim() === '') {
           return true;
         }
         // If value provided, it must be exactly 10 digits
         return /^\d{10}$/.test(value);
       }),
     alternativeType: yup
       .string()
       .required("Relation is required")
       .oneOf(
        ["Father", "Mother", "Brother", "Sister", "Son", "Daughter", "Spouse", "Other"],
         "Select a valid relation" 
        ),
     photo: yup
        .mixed()
        .required("Photo is required")
        .test("fileExists", "Photo file is required", value => value instanceof File || (value && typeof value === "object")),
      }),
 
  // Step 1: Address
     yup.object().shape({
     country: yup.string().required("Country is required"),
     state: yup.string().required("State is required"),
     district: yup.string().required("District is required"),
     block: yup.string().required("Block is required"),
     village: yup.string().required("Village is required"),
     pincode: yup.string()
      .required("Pincode is required")
      .matches(/^\d{6}$/, "Enter a valid 6-digit pincode"),
     }),
 
  // Step 2: Professional Information
     yup.object().shape({
  education: yup
    .string()
    .required("Education is required"),

  experience: yup
    .string()
    .required("Experience is required"),
}),

   // Step 3: Current Crop Information
  yup.object().shape({
  surveyNumber: yup
    .string()
    .notRequired()
    .matches(/^[a-zA-Z0-9\-\/]+$/, { message: "Enter valid survey number", excludeEmptyString: true }),
  totalLandHolding: yup
    .string()
    .notRequired()
    .matches(/^\d+(\.\d{1,2})?$/, { message: "Enter valid land size", excludeEmptyString: true }),
  geoTag: yup
    .string()
    .notRequired()
    .matches(/^[a-zA-Z0-9\-]+$/, { message: "Enter valid geo-tag", excludeEmptyString: true }),
  selectCrop: yup.string().notRequired(),
  netIncome: yup
    .string()
    .notRequired()
    .matches(/^\d+$/, { message: "Enter valid numeric income", excludeEmptyString: true }),
  soilTest: yup.string().required("Soil test selection is required"),
  soilTestCertificate: yup.mixed().notRequired()
}),

 
   // Step 4: Proposed Crop Information
    yup.object().shape({
  surveyNumber: yup.string().notRequired().matches(/^[a-zA-Z0-9\-\/]+$/, { message: "Invalid survey number", excludeEmptyString: true }),
  geoTag: yup.string().notRequired().matches(/^[a-zA-Z0-9\-]+$/, { message: "Invalid geo tag", excludeEmptyString: true }),
  cropType: yup.string().notRequired().matches(/^[a-zA-Z\s]+$/, { message: "Only alphabets allowed", excludeEmptyString: true }),
  totalLandHolding: yup.string().notRequired().matches(/^\d+(\.\d{1,2})?$/, { message: "Enter valid land size", excludeEmptyString: true }),
  netIncome: yup.string().notRequired().matches(/^\d+$/, { message: "Enter valid income", excludeEmptyString: true }),
  soilTest: yup.string().notRequired(),
  soilTestCertificate: yup.mixed().notRequired()
}),

 
   // Step 5: Irrigation Details
    yup.object().shape({
  waterSource: yup.string().notRequired(),
  borewellDischarge: yup.string().notRequired(),
  summerDischarge: yup.string().notRequired(),
  borewellLocation: yup.string().notRequired()
}),

 
  // Step 6: Other Information (Bank)
    yup.object().shape({
  bankName: yup.string().notRequired(),
  accountNumber: yup
    .string()
    .notRequired()
    .matches(/^\d{9,18}$/, { message: "Account Number must be 9-18 digits", excludeEmptyString: true }),
  branchName: yup.string().notRequired(),
  ifscCode: yup
    .string()
    .notRequired()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: "Enter valid IFSC code", excludeEmptyString: true }),
  passbookFile: yup
    .mixed()
    .notRequired()
    .test("fileSize", "File is too large", value => !value || value.size <= 5 * 1024 * 1024)
    .test("fileType", "Unsupported format", value =>
      !value || ["image/jpeg", "image/png", "application/pdf"].includes(value.type)
    )
}),


 
 // Step 7: Documents
    yup.object().shape({
    voterId: yup.string().nullable(),
    aadharNumber: yup.string()
      .nullable()
      .matches(/^\d{12}$/, "Aadhar must be 12 digits"),
    panNumber: yup.string()
      .nullable()
      .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter valid PAN number"),
    ppbNumber: yup
    .string()
    .required("PPB Number is required"),
    passbookPhoto: yup.mixed()
      .nullable()
      .test("fileSize", "File too large", value => !value || value.size <= 10 * 1024 * 1024),
     }), 
  
  ]; 

export default stepSchemas;
