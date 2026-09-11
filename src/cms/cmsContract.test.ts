import { describe, expect, it } from "vitest";
import { parseCmsResolvedPage } from "./cmsContract";

/** Published CMS delivery uses version zero for the storefront template. */
function publishedPage(templateVersion: unknown) {
  return {
    contractVersion: 0,
    site: "storefront",
    path: "/",
    locale: "en",
    channel: "web",
    page: {
      code: "home",
      renderer: "agora.page.home",
      rendererContractVersion: 1,
      rendererChannels: ["web"],
      rendererDeprecated: false,
      templateContract: {
        code: "storefront",
        renderer: "agora.template.storefront",
        contractVersion: templateVersion,
      },
      components: [],
    },
  };
}

describe("published storefront template contract", () => {
  it.each([0, 1])("accepts integer version %s", (version) => {
    expect(
      parseCmsResolvedPage(publishedPage(version)).page.templateContract
        ?.contractVersion,
    ).toBe(version);
  });
  it.each([-1, 0.5, "0", null])("rejects invalid version %s", (version) => {
    expect(() => parseCmsResolvedPage(publishedPage(version))).toThrow(
      "template.contractVersion",
    );
  });
});
