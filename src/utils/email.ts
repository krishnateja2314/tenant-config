export function isValidEmailAddress(value: string): boolean {
  const email = value.trim();
  if (!email) return false;

  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return false;

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);

  if (!localPart || !domainPart) return false;
  if (localPart.includes(" ") || domainPart.includes(" ")) return false;
  if (domainPart.startsWith(".") || domainPart.endsWith(".")) return false;

  const dotIndex = domainPart.indexOf(".");
  if (dotIndex <= 0 || dotIndex === domainPart.length - 1) return false;

  return true;
}
