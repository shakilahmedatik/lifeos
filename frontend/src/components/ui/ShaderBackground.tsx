import {
  GrainGradient,
  type GrainGradientProps,
  MeshGradient,
  type MeshGradientProps,
  NeuroNoise,
  type NeuroNoiseProps,
} from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";
import type { ComponentType } from "react";
import { cn } from "../../lib/utils.js";

type ShaderVariantProps = {
  "mesh-gradient": MeshGradientProps;
  "neuro-noise": NeuroNoiseProps;
  "grain-gradient": GrainGradientProps;
};

export type ShaderBackgroundVariant = keyof ShaderVariantProps;

export type ShaderBackgroundProps = {
  [K in ShaderBackgroundVariant]: { variant: K } & ShaderVariantProps[K];
}[ShaderBackgroundVariant];

const VARIANT_COMPONENTS: {
  [K in ShaderBackgroundVariant]: ComponentType<ShaderVariantProps[K]>;
} = {
  "mesh-gradient": MeshGradient,
  "neuro-noise": NeuroNoise,
  "grain-gradient": GrainGradient,
};

export const SHADER_BACKGROUND_VARIANTS = Object.keys(
  VARIANT_COMPONENTS,
) as ShaderBackgroundVariant[];

/**
 * Not every variant animates (e.g. dot-grid is a static pattern), so `speed`
 * is only frozen for reduced motion when the variant actually exposes it.
 */
export function ShaderBackground({ variant, className, ...rest }: ShaderBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const Shader = VARIANT_COMPONENTS[variant] as ComponentType<Record<string, unknown>>;
  const props = rest as Record<string, unknown>;
  const speedProps = reducedMotion && "speed" in props ? { speed: 0 } : {};

  return (
    <div className={cn("h-full w-full relative", className)}>
      <Shader {...props} {...speedProps} className="h-full w-full absolute inset-0 -z-10" />
    </div>
  );
}
