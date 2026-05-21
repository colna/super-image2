import type { ImageProvider } from "@super-image/utils";

const providers = new Map<string, ImageProvider>();

export function registerProvider(provider: ImageProvider): void {
  providers.set(provider.id, provider);
}

export function getProvider(id: string): ImageProvider | undefined {
  return providers.get(id);
}

export function getAllProviders(): ImageProvider[] {
  return Array.from(providers.values());
}
