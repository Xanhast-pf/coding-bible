export const createCanonicalBibleUrl = (href: string) => {
  const url = new URL(href);
  url.search = "";
  url.hash = "";

  return url.toString();
};

export const createCanonicalRuleUrl = (href: string, ruleId: string) => {
  const url = new URL(createCanonicalBibleUrl(href));
  url.hash = ruleId;

  return url.toString();
};
