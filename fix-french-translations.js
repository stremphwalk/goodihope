// Temporary script to identify all French translation issues in the generated notes
// This helps us understand the scope of fixes needed

const issues = [
  "1. Ventilator settings text still in English",
  "2. Laboratory test names not translated in ICU sections",
  "3. Physical exam findings inconsistent translation",
  "4. Blood gas values using English names",
  "5. Multiple similar code blocks causing replacement conflicts"
];

console.log("French Translation Issues to Fix:");
issues.forEach((issue, index) => {
  console.log(`${index + 1}. ${issue}`);
});