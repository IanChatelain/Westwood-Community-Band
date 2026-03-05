import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

function getR2RemotePatterns(): NextConfig["images"] extends { remotePatterns?: infer R } ? R : never {
  try {
    const url = process.env.R2_PUBLIC_URL;
    if (url) {
      const u = new URL(url);
      return [
        {
          protocol: u.protocol.replace(":", "") as "http" | "https",
          hostname: u.hostname,
          pathname: "/**",
          port: "",
          search: "",
        },
      ] as NextConfig["images"] extends { remotePatterns?: infer R } ? R : never;
    }
  } catch {
    // ignore
  }
  return [] as NextConfig["images"] extends { remotePatterns?: infer R } ? R : never;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getR2RemotePatterns(),
  },
};

export default withBotId(nextConfig);
